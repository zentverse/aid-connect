import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Language } from '../translations';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showContribModal, setShowContribModal] = useState(false);

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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
              <i className="fa-solid fa-hand-holding-heart"></i>
            </div>
            {/* AidConnect remains untranslated as per request */}
            <span className="font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">AidConnect</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {!isHome && !isDashboard && (
              <nav className="flex items-center gap-4 hidden md:flex">
                 <Link to="/request" className={`text-sm font-medium ${location.pathname === '/request' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                   {t('nav_request')}
                 </Link>
                 <Link to="/status" className={`text-sm font-medium ${location.pathname === '/status' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                   {t('nav_status')}
                 </Link>
                 {/* Only show Dashboard link if NOT on beneficiary pages */}
                 {!isBeneficiaryPage && (
                   <Link to="/donate" className={`text-sm font-medium ${location.pathname === '/donate' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                     {t('nav_dashboard')}
                   </Link>
                 )}
              </nav>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <i className="fa-solid fa-moon"></i> : <i className="fa-solid fa-sun text-yellow-400"></i>}
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 mt-auto transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 dark:text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} AidConnect. {t('footer_text')}
        </div>
      </footer>

      {/* Floating Contribute Button (Bottom Left) */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setShowContribModal(true)}
          className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-white shadow-lg border border-slate-200 dark:border-none hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center text-lg"
          title={t('nav_contribute')}
        >
          <i className="fa-solid fa-heart text-red-500 dark:text-red-400"></i>
        </button>
      </div>

      {/* Floating Language Switcher (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {showLangMenu && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col mb-2 animate-fade-in-up">
            <button onClick={() => selectLang('en')} className={`px-4 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700 ${language === 'en' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>English</button>
            <button onClick={() => selectLang('si')} className={`px-4 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700 ${language === 'si' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>සිංහල</button>
            <button onClick={() => selectLang('ta')} className={`px-4 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700 ${language === 'ta' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>தமிழ்</button>
          </div>
        )}
        <button 
          onClick={toggleLangMenu}
          className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-white shadow-lg border border-slate-200 dark:border-none hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center text-lg"
          title="Change Language"
        >
          <i className="fa-solid fa-language"></i>
        </button>
      </div>

      {/* Contribute Modal */}
      {showContribModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 dark:border-slate-700 relative animate-scale-up">
             <button
               onClick={() => setShowContribModal(false)}
               className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
             >
               <i className="fa-solid fa-times text-lg"></i>
             </button>

             <div className="text-center">
               <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                 <i className="fa-solid fa-hand-holding-heart"></i>
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{t('contrib_title')}</h3>

               <div className="space-y-3">
                 <a
                   href="#" 
                   className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                 >
                   <i className="fa-solid fa-bug"></i> {t('btn_report_bug')}
                 </a>
                 <a
                   href="#"
                   className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
                 >
                   <i className="fa-solid fa-mug-hot"></i> {t('btn_support_dev')}
                 </a>
               </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};