import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AidRequest, RequestStatus } from '../types';
import { getRequestByNic, saveRequest, calculateStatus } from '../services/storageService';

export const UpdateStatusPage: React.FC = () => {
  const location = useLocation();
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
      case RequestStatus.FULFILLED: return 'bg-green-100 text-green-700 border-green-200';
      case RequestStatus.PARTIALLY_FULFILLED: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Check & Update Status</h1>
        <p className="text-slate-500">Enter your NIC or ID number to find your request and confirm receipt of items.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={onSearchSubmit} className="flex flex-col gap-2">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchNic}
              onChange={(e) => {
                setSearchNic(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter NIC / ID Number (e.g. 200013501678 or 660581758v)"
              className={`flex-1 bg-white text-slate-900 p-3 rounded-lg border outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-500'}`}
            />
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70"
            >
              {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Search'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm ml-1">{error}</p>}
        </form>
      </div>

      {searched && requests.length === 0 && !error && !loading && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="text-slate-300 text-4xl mb-3"><i className="fa-regular fa-folder-open"></i></div>
          <h3 className="text-lg font-medium text-slate-900">No requests found</h3>
          <p className="text-slate-500">Could not find any requests associated with "{searchNic}".</p>
        </div>
      )}

      <div className="space-y-6">
        {requests.map((req, reqIndex) => (
          <div key={req.id} className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-wrap justify-between items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg text-slate-800">{req.fullName}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                </div>
                <div className="text-sm text-slate-500 flex gap-4">
                   <span><i className="fa-solid fa-location-dot mr-1"></i> {req.location}</span>
                   <span><i className="fa-regular fa-clock mr-1"></i> {new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                 <div className="text-xs text-slate-400">Request ID</div>
                 <div className="font-mono text-slate-600">{req.id}</div>
              </div>
            </div>

            <div className="p-6">
              <h4 className="font-medium text-slate-700 mb-4">Items requested</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Item</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-center">Needed</th>
                      <th className="px-4 py-3 text-center">Received</th>
                      <th className="px-4 py-3 rounded-r-lg text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {req.items.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                        <td className="px-4 py-3 text-slate-500">{item.category}</td>
                        <td className="px-4 py-3 text-center font-semibold">{item.quantityNeeded} {item.unit}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${item.quantityReceived >= item.quantityNeeded ? 'text-green-600' : 'text-amber-600'}`}>
                            {item.quantityReceived}
                          </span>
                           <span className="text-slate-400 text-xs ml-1">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button
                               onClick={() => handleQuantityReceivedChange(reqIndex, item.id, item.quantityReceived + 1)}
                               disabled={item.quantityReceived >= item.quantityNeeded}
                               className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                             >
                               <i className="fa-solid fa-plus"></i>
                             </button>
                             <button
                               onClick={() => handleQuantityReceivedChange(reqIndex, item.id, item.quantityReceived - 1)}
                               disabled={item.quantityReceived <= 0}
                               className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
              <p className="text-xs text-slate-400 mt-4 italic">
                * Please update the "Received" count as items arrive. This helps donors know what is still needed.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};