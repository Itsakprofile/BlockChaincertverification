
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StoreService } from '../services/store';
import { BlockchainService } from '../services/blockchain';
import { StudentProfile } from '../types';

export const PublicVerify: React.FC = () => {
  const { certId: paramCertId } = useParams();
  const [certId, setCertId] = useState(paramCertId || '');
  const [certError, setCertError] = useState('');
  const parsePayloadFromHash = React.useCallback(() => {
    try {
      const hash = window.location.hash || '';
      const parts = hash.split('?');
      if (parts.length < 2) return null;
      const params = new URLSearchParams(parts[1]);
      const data = params.get('data');
      if (!data) return null;
      const decoded = decodeURIComponent(data);
      const json = atob(decoded);
      return JSON.parse(json);
    } catch (err) {
      return null;
    }
  }, []);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [status, setStatus] = useState<'VALID' | 'REVOKED' | 'NOT_FOUND' | 'INVALID' | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const performVerification = async (id: string) => {
    id = id.trim().toUpperCase();
    if (!id) {
      setCertError('Please enter a certificate ID.');
      return;
    }
    if (!id.match(/^CERT-[A-Z0-9]+$/)) {
      setCertError('Invalid certificate ID format. Expected: CERT-XXXXX');
      return;
    }
    setCertError('');
    setSearching(true);
    setError('');
    setStudent(null);
    setStatus(null);

    // Artificial delay for "blockchain verification" experience
    await new Promise(r => setTimeout(r, 1500));

    let data = StoreService.getStudentById(id);
    if (!data) {
      const payload = parsePayloadFromHash();
      if (payload && payload.id === id) data = payload as StudentProfile;
    }

    if (data) {
      setStudent(data);
      const st = await BlockchainService.getCertificateStatus(data.id, data.certificatePdfHash);
      setStatus(st);
    } else {
      setError('No matching record found in the HECT Blockchain Registry.');
      setStatus(null);
    }
    setSearching(false);
  };
 

  useEffect(() => {
    if (paramCertId) {
      performVerification(paramCertId);
    } else {
      const payload = parsePayloadFromHash();
      if (payload && payload.id) performVerification(payload.id);
    }
  }, [paramCertId, parsePayloadFromHash]);

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
           <div className="inline-block p-3 rounded-2xl bg-white shadow-sm mb-4 border border-slate-100">
             <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-2xl academic-serif">HECT</div>
           </div>
          <h2 className="academic-serif text-4xl text-slate-900 mb-2">Credential Verification Service</h2>
          <p className="text-slate-500 font-medium max-w-lg mx-auto">Providing globally recognized, tamper-proof academic verification through decentralized blockchain technology.</p>
        </div>

        {/* Input & Search Controls */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Certificate ID</label>
              <input 
                type="text" 
                placeholder="CERT-XXXXX"
                className={`w-full px-5 py-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-900 font-mono text-blue-900 uppercase transition ${ certError ? 'border-red-300' : 'border-slate-200'}`}
                value={certId}
                onChange={e => setCertId(e.target.value.toUpperCase())}
              />
              {certError && <p className="text-red-600 text-xs mt-2">{certError}</p>}
            </div>
            <div className="flex items-end">
                <button 
                  onClick={() => performVerification(certId)}
                  disabled={searching}
                  className="bg-blue-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-800 disabled:bg-blue-300 transition shadow-lg h-[60px] active:scale-95"
                >
                  {searching ? 'Verifying...' : 'Verify Record'}
                </button>
              </div>
          </div>
        </div>

        {/* Loading State */}
        {searching && (
          <div className="text-center py-20 space-y-4 bg-white rounded-2xl shadow-lg border border-slate-100">
            <div className="inline-block w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cryptographic Validation in Progress...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white p-12 rounded-2xl border-b-4 border-red-500 text-center shadow-xl animate-in slide-in-from-top duration-300">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h3>
            <p className="text-slate-500 font-medium">{error}</p>
          </div>
        )}

        {/* Success / Valid Certificate */}
        {student && !searching && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 relative">
            <div className={`p-6 text-center font-bold text-lg tracking-widest uppercase relative z-10 ${status === 'VALID' ? 'bg-green-600 text-white' : status === 'REVOKED' ? 'bg-red-600 text-white' : 'bg-slate-400 text-white'}`}>
              {status === 'VALID' ? 'VALID CERTIFICATE' : status === 'REVOKED' ? 'REVOKED CERTIFICATE' : status === 'INVALID' ? 'INVALID / TAMPERED' : 'NOT FOUND'}
            </div>

            <div className="p-8 grid md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-1">
                <div className="flex flex-col items-center">
                  <img src={student.photoBase64} className="w-40 h-40 rounded-2xl border-4 border-slate-100 object-cover shadow-xl mb-4" alt={student.name} />
                  <h3 className="text-xl font-bold text-slate-900">{student.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{student.degree} • {student.department}</p>
                  <div className="mt-4 space-y-1 text-center border-t border-slate-200 pt-4 w-full">
                    <p className="text-xs text-slate-500 font-medium">Institution: <span className="font-bold text-slate-900">{student.collegeName}</span></p>
                    {student.admissionDate && (
                      <p className="text-xs text-slate-500 font-medium">Batch: <span className="font-bold text-slate-900">{new Date(student.admissionDate).getFullYear()} – {student.yearOfPassing}</span></p>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-4">Certificate ID: <span className="font-mono text-slate-700">{student.id}</span></p>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <p className="text-sm font-bold text-slate-700">Student Details</p>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm text-slate-700">
                    <div><span className="text-xs text-slate-400">Register Number</span><div className="font-semibold">{student.registerNumber}</div></div>
                    <div><span className="text-xs text-slate-400">Year of Passing</span><div className="font-semibold">{student.yearOfPassing}</div></div>
                    {student.admissionDate && (
                      <div><span className="text-xs text-slate-400">Admission Date</span><div className="font-semibold">{new Date(student.admissionDate).toLocaleDateString()}</div></div>
                    )}
                    <div><span className="text-xs text-slate-400">Institution</span><div className="font-semibold">{student.collegeName}</div></div>
                  </div>
                </div>

                

                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm font-bold text-slate-700 mb-2">Certificate Preview</p>
                  {student.certificateBase64 ? (
                    <div className="w-full h-96 border rounded-lg relative overflow-hidden bg-white">
                      <iframe src={student.certificateBase64 + '#toolbar=0&navpanes=0'} className="w-full h-full" title="Certificate PDF" onError={() => { }} />
                    </div>
                  ) : (
                    <div className="w-full h-96 border rounded-lg flex items-center justify-center bg-slate-50">
                      <div className="text-center text-slate-500">
                        <p className="font-semibold">Certificate not available</p>
                        <p className="text-xs mt-1">PDF preview unavailable</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link to="/" className="text-blue-900 font-bold hover:underline text-sm uppercase tracking-widest flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span>Back to Institution Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
