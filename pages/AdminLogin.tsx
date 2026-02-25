
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@hect.edu' && password === 'admin123') {
      localStorage.setItem('sl_session', JSON.stringify({ role: 'admin', userId: 'ADMIN_01' }));
      navigate('/admin-dashboard');
    } else {
      setError('Invalid credentials for Registrar Access.');
    }
  };

  return (
    <div className="bg-slate-50 py-24 px-4 flex justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-blue-900 p-8 text-center">
          <h2 className="academic-serif text-3xl text-white font-bold">Admin Login</h2>
          <p className="text-blue-200 text-sm mt-2 uppercase tracking-widest font-semibold">Restricted Access</p>
        </div>
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-100 font-medium">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Work Email</label>
              <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hect.edu"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Security Code</label>
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
            Authorize Access
          </button>
          <div className="text-center">
              <p className="text-xs text-slate-500 font-medium italic">
              Use admin@hect.edu / admin123 for demo
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
