import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreService } from '../services/store';
import { BlockchainService } from '../services/blockchain';
import { StudentProfile, Certificate } from '../types';

export const AdminCertificateManager: React.FC = () => {
  const navigate = useNavigate();
  const [searchRegisterNumber, setSearchRegisterNumber] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [certificate, setCertificate] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [certStatuses, setCertStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    const sessionStr = localStorage.getItem('sl_session');
    if (!sessionStr || JSON.parse(sessionStr).role !== 'admin') {
      navigate('/admin-login');
      return;
    }
  }, [navigate]);

  const handleFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setCertificate(null);

    if (!searchRegisterNumber.trim()) {
      setError('Please enter a register number');
      return;
    }

    const student = StoreService.getStudentByRegisterNumber(searchRegisterNumber.trim());
    
    if (!student) {
      setError(`No student found with register number "${searchRegisterNumber}"`);
      setSelectedStudent(null);
      return;
    }

    setSelectedStudent(student);
    loadCertificateStatuses(student);
  };

  const loadCertificateStatuses = async (student: StudentProfile) => {
    const statusMap: Record<string, string> = {};
    if (student.certificates && student.certificates.length > 0) {
      for (const cert of student.certificates) {
        const st = await BlockchainService.getCertificateStatus(cert.id, cert.certificatePdfHash);
        statusMap[cert.id] = st;
      }
    }
    setCertStatuses(statusMap);
  };

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      setError('No student selected');
      return;
    }

    if (!certificate) {
      setError('Please select a certificate file');
      return;
    }

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      console.log('Starting certificate upload process...');
      
      // Hash the certificate file
      console.log('Hashing certificate file...');
      const certHash = await BlockchainService.hashFile(certificate);
      console.log('Certificate hash:', certHash);
      
      // Convert file to base64
      console.log('Converting file to base64...');
      const certBase64 = await handleFileToBase64(certificate);
      console.log('File converted to base64, length:', certBase64.length);
      
      // Generate certificate ID
      const certId = 'CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      console.log('Generated certificate ID:', certId);

      const newCertificate: Certificate = {
        id: certId,
        certificateBase64: certBase64,
        certificatePdfHash: certHash,
        uploadedAt: Date.now(),
        status: 'ISSUED'
      };

      // Add to blockchain
      console.log('Adding to blockchain...');
      await BlockchainService.addBlock({
        certificateId: certId,
        studentName: selectedStudent.name,
        registerNumber: selectedStudent.registerNumber,
        pdfHash: certHash,
        status: 'ISSUED'
      });
      console.log('Successfully added to blockchain');

      // Add certificate to existing student
      console.log('Adding certificate to student record...');
      StoreService.addCertificateToStudent(selectedStudent.id, newCertificate);
      console.log('Successfully added to student record');

      // Update selected student with new certificate list
      console.log('Refreshing student data...');
      const updatedStudent = StoreService.getStudentById(selectedStudent.id);
      if (updatedStudent) {
        setSelectedStudent(updatedStudent);
        await loadCertificateStatuses(updatedStudent);
      }

      setCertificate(null);
      setSuccess(`Certificate (${certId}) successfully added to ${selectedStudent.name}'s account!`);
      console.log('Certificate upload process completed successfully');
    } catch (err) {
      console.error('Error during certificate upload:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to add certificate: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchRegisterNumber('');
    setSelectedStudent(null);
    setCertificate(null);
    setSuccess('');
    setError('');
  };

  const handleRevoke = async (certificateId: string) => {
    try {
      setLoading(true);
      setError('');
      
      await BlockchainService.revokeCertificate(certificateId);
      
      if (selectedStudent) {
        await loadCertificateStatuses(selectedStudent);
      }
      
      setSuccess('Certificate revoked successfully.');
    } catch (err) {
      console.error('Failed to revoke certificate:', err);
      setError('Failed to revoke certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h2 className="academic-serif text-3xl font-bold text-slate-900">Certificate Management</h2>
          <p className="text-slate-500 font-medium mt-2">Add certificates to existing student accounts</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6 uppercase tracking-wide">Find Student</h3>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Register Number</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  placeholder="Enter student's register number"
                  className="flex-grow px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition text-slate-900 font-medium"
                  value={searchRegisterNumber}
                  onChange={e => setSearchRegisterNumber(e.target.value)}
                />
                <div className="flex gap-3">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-bold transition active:scale-95 disabled:opacity-50"
                  >
                    Search
                  </button>
                  <button 
                    type="button"
                    onClick={handleClearSearch}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold transition active:scale-95"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
            
            {error && !selectedStudent && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Student Details Section */}
        {selectedStudent && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Student Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-blue-900 p-6 text-white font-bold tracking-wider uppercase text-sm">
                Student Details
              </div>
              <div className="p-6 space-y-6">
                {/* Student Photo */}
                {selectedStudent.photoBase64 && (
                  <div className="flex justify-center">
                    <img 
                      src={selectedStudent.photoBase64} 
                      className="w-32 h-32 rounded-xl border-4 border-slate-200 object-cover shadow-lg"
                      alt={selectedStudent.name}
                    />
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Student Name</p>
                    <p className="text-lg font-bold text-slate-900">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Register Number</p>
                    <p className="text-slate-900 font-semibold">{selectedStudent.registerNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Student ID</p>
                    <p className="text-slate-900 font-mono text-sm">{selectedStudent.id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Degree</p>
                      <p className="text-slate-900 font-semibold">{selectedStudent.degree}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Department</p>
                      <p className="text-slate-900 font-semibold">{selectedStudent.department}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Certificates</p>
                      <p className="text-slate-900 font-semibold text-lg">{selectedStudent.certificates?.length || (selectedStudent.certificates_legacy ? 1 : 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Revoked Certificates</p>
                      <p className="text-red-600 font-semibold text-lg">
                        {selectedStudent.certificates 
                          ? selectedStudent.certificates.filter(cert => certStatuses[cert.id] === 'REVOKED').length
                          : (selectedStudent.certificates_legacy && certStatuses[selectedStudent.id] === 'REVOKED' ? 1 : 0)
                        }
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Institution</p>
                    <p className="text-slate-900 font-semibold">{selectedStudent.collegeName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Certificate Form */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 p-6 text-white font-bold tracking-wider uppercase text-sm">
                Add New Certificate
              </div>
              <form onSubmit={handleAddCertificate} className="p-6 space-y-4">
                {success && (
                  <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200 font-medium">
                    ✓ {success}
                  </div>
                )}
                {error && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 font-medium">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Certificate PDF</label>
                  <div className="space-y-2">
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer relative ${
                      certificate ? 'border-green-300 bg-green-50' : 'border-slate-300'
                    }`}>
                      <input 
                        type="file" 
                        accept=".pdf"
                        required
                        onChange={(e) => setCertificate(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center space-y-2">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                        </svg>
                        <p className="text-sm font-bold text-slate-600">
                          {certificate ? 'File Selected' : 'Click to Select Certificate PDF'}
                        </p>
                        <button 
                          type="button"
                          className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold text-sm transition active:scale-95"
                        >
                          Choose File
                        </button>
                      </div>
                    </div>
                    {certificate && (
                      <div className="flex items-center justify-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p className="text-sm font-semibold text-blue-800">{certificate.name}</p>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading || !certificate}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-xl font-bold transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding Certificate...' : 'Add Certificate'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Certificates List */}
        {selectedStudent && selectedStudent.certificates && selectedStudent.certificates.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-6 text-white font-bold tracking-wider uppercase text-sm">
              Certificates on Record ({selectedStudent.certificates.length})
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {selectedStudent.certificates.map((cert, idx) => (
                  <div key={cert.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="inline-block bg-blue-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                            #{idx + 1}
                          </span>
                          <p className="font-mono text-sm text-slate-600">{cert.id}</p>
                        </div>
                        <p className="text-xs text-slate-500">
                          Added: {new Date(cert.uploadedAt).toLocaleDateString()} at {new Date(cert.uploadedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`px-4 py-2 rounded-full font-bold text-xs shadow-sm ${
                          certStatuses[cert.id] === 'VALID' ? 'bg-green-100 text-green-700' :
                          certStatuses[cert.id] === 'REVOKED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {certStatuses[cert.id] === 'VALID' ? 'Active' :
                           certStatuses[cert.id] === 'REVOKED' ? 'Revoked' :
                           certStatuses[cert.id] ? certStatuses[cert.id] : 'Checking...'}
                        </div>
                        {certStatuses[cert.id] !== 'REVOKED' && (
                          <button
                            onClick={() => handleRevoke(cert.id)}
                            disabled={loading || certStatuses[cert.id] === 'REVOKED'}
                            className={`px-3 py-1 rounded text-xs font-bold transition active:scale-95 ${
                              certStatuses[cert.id] === 'REVOKED' || loading
                                ? 'text-slate-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                            }`}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedStudent && (!selectedStudent.certificates || selectedStudent.certificates.length === 0) && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
            <p className="text-amber-800 font-semibold">This student has no certificates yet.</p>
            <p className="text-amber-700 text-sm mt-1">Add the first certificate using the form above.</p>
          </div>
        )}
      </div>
    </div>
  );
};
