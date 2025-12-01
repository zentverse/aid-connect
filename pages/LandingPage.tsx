import React from 'react';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-12 text-center animate-fade-in-up">
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
          Emergency Aid <span className="text-blue-600">Coordination</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
          Connecting those in need with those who can help. Real-time updates and AI-assisted requests for Sri Lankans affected by Cyclone Ditwah.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Receive Aids Card */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 hover:shadow-2xl hover:border-blue-100 transition-all duration-300 group flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-hands-holding-circle"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">I need Help</h2>
          <p className="text-slate-500 mb-8 text-center">Request essential items or update the status of your existing request.</p>
          
          <div className="grid w-full gap-3">
            <button 
              onClick={() => navigate('/request')}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              Request Aid
            </button>
            <button 
              onClick={() => navigate('/status')}
              className="w-full py-3 px-4 bg-white text-blue-600 border border-blue-200 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Update Status
            </button>
          </div>
        </div>

        {/* Send Aids Card */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 hover:shadow-2xl hover:border-emerald-100 transition-all duration-300 group flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-box-open"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">I want to Help</h2>
          <p className="text-slate-500 mb-8 text-center">View the community dashboard to see what is needed and where to send it.</p>
          
          <div className="w-full mt-auto">
            <button 
              onClick={() => navigate('/donate')}
              className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
            >
              View Needs Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};