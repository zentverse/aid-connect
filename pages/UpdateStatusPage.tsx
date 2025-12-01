import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AidRequest, RequestStatus } from '../types';
import { getRequestByNic, saveRequest, calculateStatus } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';
import { TranslationKey } from '../translations';

export const UpdateStatusPage: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const [searchNic, setSearchNic] = useState('');
  const [requests, setRequests] = useState<AidRequest[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-search if redirected with NIC
  useEffect(() => {
    if (location.state && location.state.nic) {
      setSearchNic(location.state.nic);
      handleSearch(location.state.nic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handleSearch = async (nicToSearch: string) => {
    setLoading(true);
    try {
      const results = await getRequestByNic(nicToSearch);
      setRequests(results);
      setSearched(true);
    } catch (err) {
      setError('Failed to fetch requests.');
    } finally {
      setLoading(false);
    }
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;

    if (!searchNic.trim()) {
      setError('Please enter a NIC or ID Number');
      return;
    }
    
    if (!nicRegex.test(searchNic.trim())) {
      setError('Invalid NIC. Must be 12 digits or 9 digits + V/X.');
      return;
    }

    setError('');
    handleSearch(searchNic);
  };

  const handleQuantityReceivedChange = async (reqIndex: number, itemId: string, newQty: number) => {
    const updatedRequests = [...requests];
    const request = updatedRequests[reqIndex];
    const item = request.items.find(i => i.id === itemId);
    
    if (item) {
      item.quantityReceived = Math.min(Math.max(0, newQty), item.quantityNeeded); // Clamp between 0 and needed
      // Recalculate status
      request.status = calculateStatus(request);
      request.updatedAt = Date.now();
      
      // Optimistic update locally
      setRequests(updatedRequests);

      // Save to Supabase
      try {
        await saveRequest(request);
      } catch (err) {
        alert("Failed to update quantity.");
        // Revert could go here, but keeping it simple for now
      }
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.FULFILLED: return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case RequestStatus.PARTIALLY_FULFILLED: return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
  };

  // Helper to safely translate "District - Region" strings
  const translateLocation = (loc: string) => {
    if (!loc) return '';
    const parts = loc.split(' - ');
    if (parts.length >= 1) {
       // Attempt to translate the District part
       const districtTranslated = t(parts[0] as TranslationKey);
       // If there's a region, translate it too
       if (parts.length > 1) {
         const regionTranslated = t(parts[1] as TranslationKey);
         return `${districtTranslated} - ${regionTranslated}`;
       }
       return districtTranslated;
    }
    return loc;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('status_title')}</h1>
        <p className="text-slate-500 dark:text-slate-400">{t('status_subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
        <form onSubmit={onSearchSubmit} className="flex flex-col gap-2">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchNic}
              onChange={(e) => {
                setSearchNic(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. 200013501678 or 660581758v"
              className={`flex-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-3 rounded-lg border outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'}`}
            />
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70"
            >
              {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : t('btn_search')}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm ml-1">{error}</p>}
        </form>
      </div>

      {searched && requests.length === 0 && !error && !loading && (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
          <div className="text-slate-300 dark:text-slate-600 text-4xl mb-3"><i className="fa-regular fa-folder-open"></i></div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200">{t('err_no_req')}</h3>
          <p className="text-slate-500 dark:text-slate-400">{t('err_no_req_desc')} "{searchNic}".</p>
        </div>
      )}

      <div className="space-y-6">
        {requests.map((req, reqIndex) => (
          <div key={req.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap justify-between items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{req.fullName}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 flex gap-4">
                   <span><i className="fa-solid fa-location-dot mr-1"></i> {translateLocation(req.location)}</span>
                   <span><i className="fa-regular fa-clock mr-1"></i> {new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                 <div className="text-xs text-slate-400 dark:text-slate-500">{t('lbl_req_id')}</div>
                 <div className="font-mono text-slate-600 dark:text-slate-300">{req.id}</div>
              </div>
            </div>

            <div className="p-6">
              <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-4">{t('lbl_items_req')}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">{t('th_item')}</th>
                      <th className="px-4 py-3">{t('th_category')}</th>
                      <th className="px-4 py-3 text-center">{t('th_needed')}</th>
                      <th className="px-4 py-3 text-center">{t('th_received')}</th>
                      <th className="px-4 py-3 rounded-r-lg text-right">{t('th_action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {req.items.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t(item.category as TranslationKey)}</td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">{item.quantityNeeded} {t(item.unit as TranslationKey)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${item.quantityReceived >= item.quantityNeeded ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {item.quantityReceived}
                          </span>
                           <span className="text-slate-400 dark:text-slate-500 text-xs ml-1">{t(item.unit as TranslationKey)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button
                               onClick={() => handleQuantityReceivedChange(reqIndex, item.id, item.quantityReceived + 1)}
                               disabled={item.quantityReceived >= item.quantityNeeded}
                               className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                             >
                               <i className="fa-solid fa-plus"></i>
                             </button>
                             <button
                               onClick={() => handleQuantityReceivedChange(reqIndex, item.id, item.quantityReceived - 1)}
                               disabled={item.quantityReceived <= 0}
                               className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                             >
                               <i className="fa-solid fa-minus"></i>
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 italic">
                {t('hint_update')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};