
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { StudentLogin } from './pages/StudentLogin';
import { StudentDashboard } from './pages/StudentDashboard';
import { PublicVerify } from './pages/PublicVerify';
import { UserSession } from './types';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sl_session');
    if (stored) setSession(JSON.parse(stored));
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('sl_session');
    setSession(null);
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                HECT
              </div>
              <div className="hidden md:block">
                <h1 className="academic-serif text-xl font-bold text-blue-900 leading-tight">HECT</h1>
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Education | Ethics | Excellence</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-blue-900">Home</Link>
            {!session ? (
              <>
                <Link to="/admin-login" className="text-sm font-semibold text-slate-600 hover:text-blue-900">Admin</Link>
                <Link to="/student-login" className="text-sm font-semibold text-slate-600 hover:text-blue-900">Student</Link>
              </>
            ) : (
              <>
                {session.role === 'admin' ? (
                  <Link to="/admin-dashboard" className="text-sm font-semibold text-blue-900 border-b-2 border-blue-900 pb-1">Admin Panel</Link>
                ) : (
                  <Link to="/student-dashboard" className="text-sm font-semibold text-blue-900 border-b-2 border-blue-900 pb-1">My Dashboard</Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-bold transition"
                >
                  Logout
                </button>
              </>
            )}
            <Link to="/public-verify" className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-md text-sm font-bold shadow-lg transition">
              Verify Certificate
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Footer: React.FC = () => (
  <footer className="bg-slate-900 text-white py-12">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <div className="flex justify-center space-x-6 mb-8">
        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center academic-serif font-bold italic">S</div>
        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center academic-serif font-bold italic">L</div>
        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center academic-serif font-bold italic">U</div>
      </div>
      <h3 className="academic-serif text-2xl mb-2">HECT</h3>
      <p className="text-slate-400 text-sm mb-6">Established 1924 • Accredited Institution</p>
      <div className="flex justify-center space-x-8 text-xs font-semibold text-slate-500 uppercase tracking-widest border-t border-white/10 pt-8">
        <a href="#" className="hover:text-white">Privacy Policy</a>
        <a href="#" className="hover:text-white">Terms of Service</a>
        <a href="#" className="hover:text-white">Contact Us</a>
      </div>
      <p className="mt-8 text-xs text-slate-600">© 2024 HECT. All rights reserved. Managed by Registrar's Office.</p>
    </div>
  </footer>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/public-verify" element={<PublicVerify />} />
            <Route path="/verify/:certId" element={<PublicVerify />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
