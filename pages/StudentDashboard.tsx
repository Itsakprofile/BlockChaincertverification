
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreService } from '../services/store';
import { BlockchainService } from '../services/blockchain';
import { StudentProfile } from '../types';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [statuses, setStatuses] = useState<Record<string, 'VALID' | 'REVOKED' | 'NOT_FOUND' | 'INVALID'>>({});
  const [downloadError, setDownloadError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Define certificate list at top
  const certList = Array.isArray(student?.certificates)
    ? student.certificates
    : (student?.certificates_legacy ? [{
        id: student.id,
        certificateBase64: student.certificates_legacy.certificateBase64 || '',
        certificatePdfHash: student.certificates_legacy.certificatePdfHash,
        uploadedAt: student.createdAt,
        status: 'ISSUED' as const
      }] : []);

  // Filter certificates
  const activeCertificates = certList.filter(c => statuses[c.id] === 'VALID');
  const revokedCertificates = certList.filter(c => statuses[c.id] === 'REVOKED');

  // Display logic
  const displayCertificates =
    activeCertificates.length > 0
      ? activeCertificates
      : revokedCertificates;

  // Check if all certificates are revoked
  const allRevoked = certList.length > 0 && certList.every(c => statuses[c.id] === 'REVOKED');

  useEffect(() => {
    const sessionStr = localStorage.getItem('sl_session');
    if (!sessionStr) {
      navigate('/student-login');
      return;
    }
    const session = JSON.parse(sessionStr);
    if (session.role !== 'student') {
      navigate('/');
      return;
    }

    const data = StoreService.getStudentById(session.userId);
    if (data) {
      setStudent(data);
      checkAuthenticityForAllCerts(data);
    }
  }, [navigate]);

  const checkAuthenticityForAllCerts = async (data: StudentProfile) => {
    const statusMap: Record<string, 'VALID' | 'REVOKED' | 'NOT_FOUND' | 'INVALID'> = {};
    
    if (data.certificates && data.certificates.length > 0) {
      for (const cert of data.certificates) {
        const st = await BlockchainService.getCertificateStatus(cert.id, cert.certificatePdfHash);
        statusMap[cert.id] = st;
      }
    }
    // Fallback for legacy format
    else if (data.certificates_legacy?.certificatePdfHash) {
      const st = await BlockchainService.getCertificateStatus(data.id, data.certificates_legacy.certificatePdfHash);
      statusMap[data.id] = st;
    }
    
    setStatuses(statusMap);
  };

  const downloadCertificate = (certBase64: string, certificateId: string) => {
    setDownloadError('');
    if (!certBase64) {
      setDownloadError('Certificate file not available for download.');
      return;
    }
    const a = document.createElement('a');
    a.href = certBase64;
    a.download = `${certificateId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const makePublicLink = (s: StudentProfile) => {
    try {
      const payload = btoa(JSON.stringify({
        id: s.id,
        name: s.name,
        registerNumber: s.registerNumber,
        loginId: s.loginId,
        passwordHash: s.passwordHash,
        certificates: s.certificates
      }));
      return `${window.location.origin}/#/verify/${s.id}?data=${encodeURIComponent(payload)}`;
    } catch (e) {
      return `${window.location.origin}/#/verify/${s.id}`;
    }
  };

  const publicLink = student ? makePublicLink(student) : `${window.location.origin}/#/verify/`;

  const goToPreviousCert = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : displayCertificates.length - 1);
  };

  const goToNextCert = () => {
    setCurrentIndex(prev => prev < displayCertificates.length - 1 ? prev + 1 : 0);
  };

  if (!student) return <div className="p-12 text-center text-slate-500">Loading Academic Profile...</div>;

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          {/* Cover Header */}
          <div className="bg-blue-900 h-32 relative">
            <div className="absolute -bottom-16 left-8">
              <img 
                src={student.photoBase64} 
                className="w-32 h-32 rounded-2xl border-4 border-white object-cover shadow-lg"
                alt={student.name}
              />
            </div>
          </div>
          
          <div className="pt-20 px-8 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div>
                <h2 className="academic-serif text-3xl font-bold text-slate-900">{student.name}</h2>
                <p className="text-slate-500 font-semibold tracking-wide uppercase text-sm mt-1">{student.degree} in {student.department}</p>
                <p className="text-slate-400 text-xs mt-1">Class of {student.yearOfPassing} • {student.collegeName}</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                  {certList.length > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-semibold mb-2">CERTIFICATES ({certList.length})</p>
                      <div className="flex flex-col gap-2">
                        {certList.map(cert => (
                          <div key={cert.id} className={`flex items-center space-x-2 px-4 py-2 rounded-full font-bold text-sm shadow-sm ${
                            statuses[cert.id] === 'VALID' ? 'bg-green-100 text-green-700' :
                            statuses[cert.id] === 'REVOKED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            <span className={`w-3 h-3 rounded-full ${
                              statuses[cert.id] === 'VALID' ? 'bg-green-500' :
                              statuses[cert.id] === 'REVOKED' ? 'bg-red-500' :
                              'bg-yellow-500'
                            }`}></span>
                            <span>{statuses[cert.id] === 'REVOKED' ? 'Revoked' : statuses[cert.id] === 'NOT_FOUND' || statuses[cert.id] === 'INVALID' ? 'Unknown': ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 font-mono mt-2">STUDENT ID: {student.id}</p>
              </div>
            </div>

            <div className="mt-12 space-y-12">
              {/* Profile Details */}
              <div className="max-w-2xl mx-auto">
                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest border-b pb-2 mb-6">Academic Record</h3>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Registration Number</p>
                    <p className="text-slate-900 font-semibold">{student.registerNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Year of Convocation</p>
                    <p className="text-slate-900 font-semibold">{student.yearOfPassing}</p>
                  </div>
                  {student.admissionDate && (
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[10px]">Admission Date</p>
                      <p className="text-slate-900 font-semibold">{new Date(student.admissionDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Account Created</p>
                    <p className="text-slate-900 font-semibold">{new Date(student.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Institution</p>
                    <p className="text-slate-900 font-semibold">HECT</p>
                  </div>
                </div>

                <div className="pt-6 space-y-3">
                  {downloadError && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 font-medium">{downloadError}</div>}
                  {certList.length === 0 && <div className="p-3 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200 font-medium">No certificates available</div>}
                </div>
              </div>

              {/* Certificate Preview */}
              <div className="flex flex-col items-center">
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                  {displayCertificates.length > 0 && displayCertificates[currentIndex]?.certificateBase64 ? (
                    <div className="space-y-6">
                      <div className="text-center mb-3">
                        <p className="text-base font-bold text-slate-800">Certificate ID: <span className="font-bold text-lg">{displayCertificates[currentIndex].id}</span></p>
                      </div>

                      {/* Certificate Display */}
                      <div className="w-full h-96 border rounded-xl overflow-hidden bg-slate-50">
                        <iframe 
                          src={displayCertificates[currentIndex].certificateBase64 + '#toolbar=0&navpanes=0'} 
                          className="w-full h-full" 
                          title="Certificate Preview" 
                        />
                      </div>

                      {/* Revoked Status Text - only when all certificates are revoked */}
                      {allRevoked && (
                        <div className="text-center">
                          <p className="text-red-600 text-sm font-medium">Certificate Revoked</p>
                        </div>
                      )}

                      {/* Navigation and Indicator */}
                      {displayCertificates.length > 1 && (
                        <div className="flex items-center justify-between">
                          <button
                            onClick={goToPreviousCert}
                            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition active:scale-95"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                            </svg>
                            <span>Previous</span>
                          </button>
                          
                          <span className="text-sm text-slate-500 font-medium">
                            Certificate {currentIndex + 1} of {displayCertificates.length}
                          </span>
                          
                          <button
                            onClick={goToNextCert}
                            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition active:scale-95"
                          >
                            <span>Next</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                            </svg>
                          </button>
                        </div>
                      )}

                      {/* Download Button */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => downloadCertificate(displayCertificates[currentIndex].certificateBase64, displayCertificates[currentIndex].id)}
                          disabled={statuses[displayCertificates[currentIndex].id] === 'REVOKED' || !displayCertificates[currentIndex].certificateBase64}
                          className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold text-sm transition active:scale-95 ${
                            statuses[displayCertificates[currentIndex].id] === 'REVOKED' || !displayCertificates[currentIndex].certificateBase64
                              ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                              : 'bg-blue-900 text-white hover:bg-blue-800 shadow-md'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                          </svg>
                          <span>Download Certificate</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-96 border rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                      <div className="text-center text-slate-500">
                        <p className="font-semibold">No certificates available</p>
                        <p className="text-xs mt-1">Contact Registrar's Office for assistance</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 text-sm font-medium">© Hindusthan College of Engineering and Technology (HECT)</p>
        </div>
      </div>
    </div>
  );
};
