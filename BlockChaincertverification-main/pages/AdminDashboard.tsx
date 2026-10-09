
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreService } from '../services/store';
import { BlockchainService } from '../services/blockchain';
import { StudentProfile, Certificate } from '../types';
import * as XLSX from 'xlsx';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [searchRegisterNumber, setSearchRegisterNumber] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    registerNumber: '',
    degree: '',
    department: '',
    collegeName: 'HINDUSTHAN COLLEGE OF ENGINEERING AND TECHNOLOGY',
    admissionDate: '',
    yearOfPassing: new Date().getFullYear().toString()
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [certificate, setCertificate] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  // Filter students based on search input
  const filteredStudents = useMemo(() => {
    if (!searchRegisterNumber.trim()) {
      return students;
    }
    return students.filter(student => 
      student.registerNumber.toLowerCase().includes(searchRegisterNumber.toLowerCase())
    );
  }, [students, searchRegisterNumber]);

  // Get all certificates for display (including revoked certificates)
  const allCertificates = useMemo(() => {
    const allCerts: Array<{
      student: StudentProfile;
      certificate: Certificate;
      certIndex: number;
    }> = [];

    for (const student of filteredStudents) {
      if (student.certificates && student.certificates.length > 0) {
        student.certificates.forEach((cert, index) => {
          allCerts.push({
            student,
            certificate: cert,
            certIndex: index + 1
          });
        });
      } else if (student.certificates_legacy) {
        // Handle legacy format
        const legacyCert: Certificate = {
          id: student.id,
          certificateBase64: student.certificates_legacy.certificateBase64 || '',
          certificatePdfHash: student.certificates_legacy.certificatePdfHash,
          uploadedAt: student.createdAt,
          status: 'ISSUED'
        };
        allCerts.push({
          student,
          certificate: legacyCert,
          certIndex: 1
        });
      }
    }

    return allCerts;
  }, [filteredStudents, statuses]);
  
  const handleClearSearch = () => {
    setSearchRegisterNumber('');
  };

  useEffect(() => {
    const sessionStr = localStorage.getItem('sl_session');
    if (!sessionStr) {
      navigate('/admin-login');
      return;
    }
    
    try {
      const session = JSON.parse(sessionStr);
      if (session.role !== 'admin') {
        navigate('/admin-login');
        return;
      }
    } catch (error) {
      console.error('Failed to parse session data:', error);
      navigate('/admin-login');
      return;
    }
    
    setStudents(StoreService.getStudents());
  }, []);

  const handleFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: Record<string, string> = {};
    
    if (!formData.registerNumber.trim()) {
      errors.registerNumber = 'Register number is required';
    }
    
    if (formData.admissionDate) {
      const admissionDate = new Date(formData.admissionDate);
      if (admissionDate > new Date()) {
        errors.admissionDate = 'Admission date cannot be in the future';
      }
    }
    
    const passingYear = parseInt(formData.yearOfPassing);
    if (formData.admissionDate) {
      const admissionYear = new Date(formData.admissionDate).getFullYear();
      if (passingYear < admissionYear) {
        errors.yearOfPassing = 'Year of passing must be after or equal to admission year';
      }
    }
    
    if (!photo) {
      errors.photo = 'Student photo is required';
    }
    if (!certificate) {
      errors.certificate = 'Certificate PDF is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors({});
    setError('');

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const certHash = await BlockchainService.hashFile(certificate);
      const photoBase64 = await handleFileToBase64(photo);
      const certBase64 = await handleFileToBase64(certificate);
      const creds = StoreService.generateCredentials(formData.name, formData.registerNumber);
      const studentId = 'STUD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const certId = 'CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase();

      const newCertificate = {
        id: certId,
        certificateBase64: certBase64,
        certificatePdfHash: certHash,
        uploadedAt: Date.now(),
        status: 'ISSUED' as const
      };

      const newStudent: StudentProfile = {
        ...formData,
        id: studentId,
        photoBase64,
        certificates: [newCertificate],
        loginId: creds.loginId,
        passwordHash: creds.password, // In real app, hash this
        createdAt: Date.now()
      };

      // Add to blockchain
      await BlockchainService.addBlock({
        certificateId: certId,
        studentName: formData.name,
        registerNumber: formData.registerNumber,
        pdfHash: certHash,
        status: 'ISSUED'
      });

      // Save to store
      StoreService.saveStudent(newStudent);
      setStudents(StoreService.getStudents());
      // Refresh status cache
      refreshStatuses();
      
      setFormData({
        name: '',
        registerNumber: '',
        degree: '',
        department: '',
        collegeName: 'HECT',
        admissionDate: '',
        yearOfPassing: new Date().getFullYear().toString()
      });
      setPhoto(null);
      setCertificate(null);
      setSuccess('Student profile created and hashed to blockchain successfully!');
    } catch (err) {
      setError('Failed to create student profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatuses = async () => {
    const map: Record<string, string> = {};
    for (const s of StoreService.getStudents()) {
      // For new format with certificates array
      if (s.certificates && s.certificates.length > 0) {
        for (const cert of s.certificates) {
          const st = await BlockchainService.getCertificateStatus(cert.id, cert.certificatePdfHash);
          map[cert.id] = st;
        }
        // Also store overall student status (for backward compatibility)
        const validCerts = s.certificates.filter(cert => map[cert.id] === 'VALID').length;
        const revokedCerts = s.certificates.filter(cert => map[cert.id] === 'REVOKED').length;
        if (revokedCerts > 0 && validCerts === 0) {
          map[s.id] = 'REVOKED';
        } else if (validCerts > 0) {
          map[s.id] = 'VALID';
        } else {
          map[s.id] = 'NOT_FOUND';
        }
      }
      // For backward compatibility with legacy format
      else if (s.certificates_legacy?.certificatePdfHash) {
        const st = await BlockchainService.getCertificateStatus(s.id, s.certificates_legacy.certificatePdfHash);
        map[s.id] = st;
      }
    }
    setStatuses(map);
  };

  useEffect(() => {
    refreshStatuses();
  }, [students]);

  const handleRevoke = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      await BlockchainService.revokeCertificate(id);
      await refreshStatuses();
      setSuccess('Certificate revoked successfully.');
    } catch (err) {
      setError('Failed to revoke certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCredentials = () => {
    const data = students.map(s => ({
      'Student Name': s.name,
      'Login ID': s.loginId,
      'Password': s.passwordHash,
      'Reg No': s.registerNumber
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Credentials");
    XLSX.writeFile(wb, "Student_Login_Credentials.xlsx");
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="academic-serif text-3xl font-bold text-slate-900">Registrar Dashboard</h2>
            <p className="text-slate-500 font-medium">Academic Year 2024-25</p>
          </div>
          <button 
            onClick={downloadCredentials}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition active:scale-95 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <span>Download Student Credentials (Excel)</span>
          </button>
        </div>

        {/* Search Bar Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-grow">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Search by Register Number</label>
              <input 
                type="text" 
                placeholder="Enter register number"
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition text-slate-900 font-medium"
                value={searchRegisterNumber}
                onChange={e => setSearchRegisterNumber(e.target.value)}
              />
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                type="button"
                onClick={handleClearSearch}
                className="flex-grow sm:flex-grow-0 bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold transition active:scale-95"
              >
                Clear
              </button>
            </div>
          </div>
          {searchRegisterNumber && filteredStudents.length === 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
              No student found with register number "{searchRegisterNumber}"
            </div>
          )}
          {searchRegisterNumber && filteredStudents.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
              Found {filteredStudents.length} student record{filteredStudents.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Create Profile Form */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-6 text-white font-bold tracking-wider uppercase text-sm">Issue New Certificate</div>
            <form onSubmit={handleCreateProfile} className="p-6 space-y-4">
              {success && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200 font-medium">{success}</div>}
              {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 font-medium">{error}</div>}
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Student Full Name</label>
                <input required className="w-full px-4 py-2 bg-slate-50 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Register Number</label>
                <input required className={`w-full px-4 py-2 bg-slate-50 border rounded-lg ${validationErrors.registerNumber ? 'border-red-500 focus:ring-red-500' : ''}`} value={formData.registerNumber} onChange={e => setFormData({...formData, registerNumber: e.target.value})} />
                {validationErrors.registerNumber && <p className="text-red-600 text-xs mt-1">{validationErrors.registerNumber}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Degree</label>
                  <input required className="w-full px-4 py-2 bg-slate-50 border rounded-lg" value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})} placeholder="e.g. B.Tech" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Year of Passing</label>
                  <input required type="number" className={`w-full px-4 py-2 bg-slate-50 border rounded-lg ${validationErrors.yearOfPassing ? 'border-red-500 focus:ring-red-500' : ''}`} value={formData.yearOfPassing} onChange={e => setFormData({...formData, yearOfPassing: e.target.value})} />
                  {validationErrors.yearOfPassing && <p className="text-red-600 text-xs mt-1">{validationErrors.yearOfPassing}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Department</label>
                <input required className="w-full px-4 py-2 bg-slate-50 border rounded-lg" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Admission Date</label>
                <input type="date" className={`w-full px-4 py-2 bg-slate-50 border rounded-lg ${validationErrors.admissionDate ? 'border-red-500 focus:ring-red-500' : ''}`} value={formData.admissionDate} onChange={e => setFormData({...formData, admissionDate: e.target.value})} />
                {validationErrors.admissionDate && <p className="text-red-600 text-xs mt-1">{validationErrors.admissionDate}</p>}
              </div>
              
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Student Photo</label>
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer relative ${validationErrors.photo ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                    <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      <p className="text-sm font-bold text-slate-600">{photo ? 'Photo Selected' : 'Click to Select Student Photo'}</p>
                      <button 
                        type="button"
                        className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-xs font-semibold transition active:scale-95"
                      >
                        Choose File
                      </button>
                    </div>
                  </div>
                  {photo && (
                    <div className="flex items-center justify-center space-x-2 p-2 bg-slate-50 border border-slate-200 rounded-lg mt-2">
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <p className="text-xs font-semibold text-slate-700">{photo.name}</p>
                    </div>
                  )}
                  {validationErrors.photo && <p className="text-red-600 text-xs mt-1">{validationErrors.photo}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Certificate PDF</label>
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer relative ${validationErrors.certificate ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                    <input type="file" accept=".pdf" onChange={e => setCertificate(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                      </svg>
                      <p className="text-sm font-bold text-slate-600">{certificate ? 'Certificate Selected' : 'Click to Select Certificate PDF'}</p>
                      <button 
                        type="button"
                        className="bg-blue-900 hover:bg-blue-800 text-white px-3 py-1 rounded text-xs font-semibold transition active:scale-95"
                      >
                        Choose File
                      </button>
                    </div>
                  </div>
                  {certificate && (
                    <div className="flex items-center justify-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded-lg mt-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <p className="text-xs font-semibold text-blue-800">{certificate.name}</p>
                    </div>
                  )}
                  {validationErrors.certificate && <p className="text-red-600 text-xs mt-1">{validationErrors.certificate}</p>}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !photo || !certificate}
                className="w-full bg-blue-900 text-white font-bold py-3 rounded-lg hover:bg-blue-800 disabled:bg-blue-300 disabled:cursor-not-allowed transition active:scale-95"
              >
                {loading ? 'Hashing to Blockchain...' : 'Issue & Verify Certificate'}
              </button>
            </form>
          </div>

          {/* Issued Certificates Registry - Always Visible */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-6 text-white font-bold tracking-wider uppercase text-sm">Issued Certificates Registry</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Student Info</th>
                    <th className="px-6 py-4">Certificate ID</th>
                    <th className="px-6 py-4">Register No</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allCertificates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">{searchRegisterNumber ? 'No certificates found with this register number.' : 'No certificates issued yet.'}</td>
                    </tr>
                  ) : (
                    allCertificates.map(({ student, certificate, certIndex }) => (
                      <tr key={certificate.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img src={student.photoBase64} className="w-10 h-10 rounded-full object-cover border" alt="" />
                            <div>
                              <p className="font-bold text-slate-900">{student.name}</p>
                              <p className="text-xs text-slate-500">{student.degree} - {student.department}</p>
                              {student.certificates && student.certificates.length > 1 && (
                                <p className="text-xs text-blue-600 font-semibold">Certificate #{certIndex}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-blue-900 font-semibold">{certificate.id}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{student.registerNumber}</td>
                        <td className="px-6 py-4">
                          {
                            statuses[certificate.id] === 'VALID' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 font-bold">Active</span>
                            ) : statuses[certificate.id] === 'REVOKED' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 font-bold">Revoked</span>
                            ) : statuses[certificate.id] === 'INVALID' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 font-bold">Invalid</span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-slate-100 text-slate-700 font-bold">Not Found</span>
                            )
                          }
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => {
                                try {
                                  const payload = btoa(JSON.stringify({
                                    id: certificate.id,
                                    name: student.name,
                                    registerNumber: student.registerNumber,
                                    loginId: student.loginId,
                                    passwordHash: student.passwordHash,
                                    certificatePdfHash: certificate.certificatePdfHash,
                                    certificateBase64: certificate.certificateBase64
                                  }));
                                  window.open(`#/verify/${certificate.id}?data=${encodeURIComponent(payload)}`, '_blank');
                                } catch (err) {
                                  setError('Failed to generate public link. Please try again.');
                                  window.open(`#/verify/${certificate.id}`, '_blank');
                                }
                              }}
                              className="text-xs font-bold text-blue-900 hover:text-blue-700 hover:underline transition active:scale-95"
                            >
                              Public Link
                            </button>
                            <button
                              onClick={() => handleRevoke(certificate.id)}
                              className={`text-xs font-bold transition active:scale-95 ${
                                statuses[certificate.id] === 'REVOKED' || loading
                                  ? 'text-slate-400 cursor-not-allowed'
                                  : 'text-red-600 hover:text-red-800'
                              }`}
                              disabled={statuses[certificate.id] === 'REVOKED' || loading}
                            >
                              {statuses[certificate.id] === 'REVOKED' ? 'Revoked' : 'Revoke'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
