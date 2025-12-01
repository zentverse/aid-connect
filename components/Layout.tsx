import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isDashboard = location.pathname === '/donate';
  
  // Define beneficiary pages where the Dashboard link should be hidden
  const isBeneficiaryPage = location.pathname === '/request' || location.pathname === '/status';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
              <i className="fa-solid fa-hand-holding-heart"></i>
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">AidConnect</span>
          </Link>
          
          {!isHome && !isDashboard && (
            <nav className="flex items-center gap-4">
               <Link to="/request" className={`text-sm font-medium ${location.pathname === '/request' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Request</Link>
               <Link to="/status" className={`text-sm font-medium ${location.pathname === '/status' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>My Status</Link>
               {/* Only show Dashboard link if NOT on beneficiary pages */}
               {!isBeneficiaryPage && (
                 <Link to="/donate" className={`text-sm font-medium ${location.pathname === '/donate' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Dashboard</Link>
               )}
            </nav>
          )}
        </div>
      </header>
      
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} AidConnect. Community Relief Coordination.
        </div>
      </footer>
    </div>
  );
};