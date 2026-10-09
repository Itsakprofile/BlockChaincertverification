
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreService } from '../services/store';

export const StudentLogin: React.FC = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const student = StoreService.getStudentByLogin(loginId);
    
    if (student && student.passwordHash === password) {
      localStorage.setItem('sl_session', JSON.stringify({ role: 'student', userId: student.id }));
      navigate('/student-dashboard');
    } else {
      setError('Invalid Student Credentials. Contact Registrar if forgotten.');
    }
  };

  return (
    <div className="bg-slate-50 py-24 px-4 flex justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-blue-900 p-8 text-center">
          <h2 className="academic-serif text-3xl text-white font-bold">Student Portal</h2>
          <p className="text-blue-200 text-sm mt-2 uppercase tracking-widest font-semibold">Credential Management</p>
        </div>
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-100 font-medium">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Login ID</label>
            <input 
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="e.g. john1234"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Student Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-900 text-white py-4 rounded-lg font-bold hover:bg-blue-800 transition shadow-lg active:scale-95"
          >
            Access My Profile
          </button>
          <p className="text-xs text-center text-slate-500 font-medium">
            Your credentials were provided at the time of graduation. 
            Lost your key? Visit the Registrar's Office with valid ID.
          </p>
        </form>
      </div>
    </div>
  );
};
