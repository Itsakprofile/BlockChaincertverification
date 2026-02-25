
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreService } from '../services/store';
import { BlockchainService } from '../services/blockchain';
import { StudentProfile } from '../types';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [status, setStatus] = useState<'VALID' | 'REVOKED' | 'NOT_FOUND' | 'INVALID' | null>(null);
  const [downloadError, setDownloadError] = useState('');

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
      checkAuthenticity(data);
    }
  }, [navigate]);

  const checkAuthenticity = async (data: StudentProfile) => {
    const st = await BlockchainService.getCertificateStatus(data.id, data.certificatePdfHash);
    setStatus(st);
  };

  const downloadCertificate = (student: StudentProfile) => {
    setDownloadError('');
    if (!student.certificateBase64) {
      setDownloadError('Certificate file not available for download.');
      return;
    }
    const a = document.createElement('a');
    a.href = student.certificateBase64;
    a.download = `${student.id}.pdf`;
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
        certificatePdfHash: s.certificatePdfHash
      }));
      return `${window.location.origin}/#/verify/${s.id}?data=${encodeURIComponent(payload)}`;
    } catch (e) {
      return `${window.location.origin}/#/verify/${s.id}`;
    }
  };

  const publicLink = student ? makePublicLink(student) : `${window.location.origin}/#/verify/`;

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
              <div className="flex flex-col items-end">
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-full font-bold text-sm shadow-sm ${status === 'VALID' ? 'bg-green-100 text-green-700' : status === 'REVOKED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    <span className={`w-3 h-3 rounded-full ${status === 'VALID' ? 'bg-green-500' : status === 'REVOKED' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                    <span>STATUS: {status === 'VALID' ? 'VALID' : status === 'REVOKED' ? 'REVOKED' : status === 'INVALID' ? 'INVALID / TAMPERED' : 'NOT FOUND'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-2">CERT ID: {student.id}</p>
              </div>
            </div>

            <div className="mt-12 grid md:grid-cols-2 gap-12">
              {/* Profile Details */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest border-b pb-2">Academic Record</h3>
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
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Issue Date</p>
                    <p className="text-slate-900 font-semibold">{new Date(student.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Institution</p>
                    <p className="text-slate-900 font-semibold">HECT</p>
                  </div>
                </div>

                <div className="pt-6 space-y-3">
                  {downloadError && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 font-medium">{downloadError}</div>}
                  <button
                    onClick={() => downloadCertificate(student)}
                    disabled={status === 'REVOKED' || !student.certificateBase64}
                    className={`flex items-center space-x-3 w-full justify-center py-4 rounded-xl font-bold transition active:scale-95 ${status === 'REVOKED' || !student.certificateBase64 ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                    <span>Download Certificate</span>
                  </button>
                </div>
              </div>

              {/* Certificate Preview */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">Certificate Preview</h3>
                {student.certificateBase64 ? (
                  <div className="w-full h-96 border rounded-lg overflow-hidden bg-white">
                    <iframe src={student.certificateBase64 + '#toolbar=0&navpanes=0'} className="w-full h-full" title="Certificate PDF" />
                  </div>
                ) : (
                  <div className="w-full h-96 border rounded-lg overflow-hidden bg-white flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <p className="font-semibold">Certificate not available</p>
                      <p className="text-xs mt-1">Contact Registrar's Office for assistance</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
