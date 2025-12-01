
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../translations';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const isHome = location.pathname === '/';
  const isDashboard = location.pathname === '/donate';
  
  // Define beneficiary pages where the Dashboard link should be hidden
  const isBeneficiaryPage = location.pathname === '/request' || location.pathname === '/status';

  const toggleLangMenu = () => setShowLangMenu(!showLangMenu);
  
  const selectLang = (lang: Language) => {
    setLanguage(lang);
    setShowLangMenu(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
              <i className="fa-solid fa-hand-holding-heart"></i>
            </div>
            {/* AidConnect remains untranslated as per request */}
            <span className="font-bold text-xl text-slate-800 tracking-tight">AidConnect</span>
          </Link>
          
          {!isHome && !isDashboard && (
            <nav className="flex items-center gap-4">
               <Link to="/request" className={`text-sm font-medium ${location.pathname === '/request' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                 {t('nav_request')}
               </Link>
               <Link to="/status" className={`text-sm font-medium ${location.pathname === '/status' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                 {t('nav_status')}
               </Link>
               {/* Only show Dashboard link if NOT on beneficiary pages */}
               {!isBeneficiaryPage && (
                 <Link to="/donate" className={`text-sm font-medium ${location.pathname === '/donate' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                   {t('nav_dashboard')}
                 </Link>
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
          &copy; {new Date().getFullYear()} AidConnect. {t('footer_text')}
        </div>
      </footer>

      {/* Floating Language Switcher */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {showLangMenu && (
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col mb-2 animate-fade-in-up">
            <button onClick={() => selectLang('en')} className={`px-4 py-2 text-sm text-left hover:bg-slate-50 ${language === 'en' ? 'font-bold text-blue-600' : 'text-slate-700'}`}>English</button>
            <button onClick={() => selectLang('si')} className={`px-4 py-2 text-sm text-left hover:bg-slate-50 ${language === 'si' ? 'font-bold text-blue-600' : 'text-slate-700'}`}>සිංහල</button>
            <button onClick={() => selectLang('ta')} className={`px-4 py-2 text-sm text-left hover:bg-slate-50 ${language === 'ta' ? 'font-bold text-blue-600' : 'text-slate-700'}`}>தமிழ்</button>
          </div>
        )}
        <button 
          onClick={toggleLangMenu}
          className="w-12 h-12 rounded-full bg-slate-800 text-white shadow-lg hover:bg-slate-700 transition-colors flex items-center justify-center text-lg"
          title="Change Language"
        >
          <i className="fa-solid fa-language"></i>
        </button>
      </div>
    </div>
  );
};
