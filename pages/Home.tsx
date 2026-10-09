
import React from 'react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative h-[600px] overflow-hidden">
        <img 
          src="https://picsum.photos/seed/college/1920/1080" 
          alt="University Campus" 
          className="absolute inset-0 w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl text-center px-4">
            <h2 className="academic-serif text-5xl md:text-7xl text-white mb-6 drop-shadow-lg">
              Empowering the Next Generation of Leaders
            </h2>
            <p className="text-xl text-slate-200 mb-10 max-w-2xl mx-auto">
              Our certificate verification system ensures the highest level of integrity and trust through blockchain technology.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/public-verify" className="bg-blue-900 text-white px-8 py-4 rounded-md font-bold text-lg hover:bg-blue-800 transition shadow-xl">
                Verify Authenticity
              </Link>
              <Link to="/student-login" className="bg-white text-blue-900 px-8 py-4 rounded-md font-bold text-lg hover:bg-slate-100 transition shadow-xl border border-white">
                Student Access
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-blue-900 py-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          <div>
            <div className="text-4xl font-bold mb-1">25k+</div>
            <div className="text-blue-300 text-sm uppercase tracking-wider font-semibold">Alumni</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-1">98%</div>
            <div className="text-blue-300 text-sm uppercase tracking-wider font-semibold">Trust Rate</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-1">100+</div>
            <div className="text-blue-300 text-sm uppercase tracking-wider font-semibold">Skilled Personnel</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-1">0%</div>
            <div className="text-blue-300 text-sm uppercase tracking-wider font-semibold">Forgery</div>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="academic-serif text-3xl text-slate-900 mb-4">Official Verification Portal</h3>
            <div className="w-24 h-1 bg-blue-900 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="p-8 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-4">Immutable Records</h4>
              <p className="text-slate-600">Certificates are cryptographically hashed and stored on a decentralized blockchain ledger, making them tamper-proof.</p>
            </div>

            <div className="p-8 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-4">Instant Verification</h4>
              <p className="text-slate-600">Employers can instantly verify credentials by scanning a QR code or entering a unique Certificate ID.</p>
            </div>

            <div className="p-8 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 012.5 2.5V14a2 2 0 11-4 0h-1a2 2 0 00-2 2 2 2 0 01-2 2H3m14-11a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-4">Global Standards</h4>
              <p className="text-slate-600">Compliant with international standards for digital credentialing and secure data interchange.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
