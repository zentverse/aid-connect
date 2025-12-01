import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-12 text-center animate-fade-in-up">
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('hero_title_1')} <span className="text-blue-600 dark:text-blue-400">{t('hero_title_2')}</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
          {t('hero_desc')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Receive Aids Card */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 hover:shadow-2xl hover:border-blue-100 dark:hover:border-blue-900 transition-all duration-300 group flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-hands-holding-circle"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('card_need_title')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-center">{t('card_need_desc')}</p>
          
          <div className="grid w-full gap-3">
            <button 
              onClick={() => navigate('/request')}
              className="w-full py-3 px-4 bg-blue-600 dark:bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
            >
              {t('btn_request_aid')}
            </button>
            <button 
              onClick={() => navigate('/status')}
              className="w-full py-3 px-4 bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-slate-600 rounded-xl font-semibold hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors"
            >
              {t('btn_update_status')}
            </button>
          </div>
        </div>

        {/* Send Aids Card */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 hover:shadow-2xl hover:border-emerald-100 dark:hover:border-emerald-900 transition-all duration-300 group flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-box-open"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('card_give_title')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-center">{t('card_give_desc')}</p>
          
          <div className="w-full mt-auto">
            <button 
              onClick={() => navigate('/donate')}
              className="w-full py-3 px-4 bg-emerald-600 dark:bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-200 dark:shadow-none"
            >
              {t('btn_view_dashboard')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};