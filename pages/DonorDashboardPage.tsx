
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, Treemap } from 'recharts';
import { getRequests } from '../services/storageService';
import { generateSituationReport } from '../services/geminiService';
import { AidRequest, DashboardStats, RequestStatus } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const CustomizedTreemapContent = (props: any) => {
  const { root, depth, x, y, width, height, index, payload, colors, rank, name, value } = props;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: COLORS[index % COLORS.length],
          stroke: '#fff',
          strokeWidth: 2,
          strokeOpacity: 1,
        }}
      />
      {width > 40 && height > 20 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
          fontWeight="500"
          dy={4}
          style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)', pointerEvents: 'none' }}
        >
          {name}
        </text>
      )}
    </g>
  );
};

const CustomTreemapTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3 py-2 border border-slate-200 shadow-lg rounded-lg">
        <p className="text-sm font-medium text-slate-900">{payload[0].payload.name}</p>
      </div>
    );
  }
  return null;
};

export const DonorDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requests, setRequests] = useState<AidRequest[]>([]);
  const [report, setReport] = useState<string>('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [filterLocation, setFilterLocation] = useState('All');

  useEffect(() => {
    const allRequests = getRequests();
    setRequests(allRequests);
    calculateStats(allRequests);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateStats = (data: AidRequest[]) => {
    const total = data.length;
    const fulfilled = data.filter(r => r.status === RequestStatus.FULFILLED).length;
    const pending = data.filter(r => r.status !== RequestStatus.FULFILLED).length;

    // Aggregate items by category to calculate percentage unfulfilled
    const categoryMap = new Map<string, { needed: number; remaining: number }>();
    
    // Aggregate keywords
    const keywordMap = new Map<string, number>();

    data.forEach(r => {
      r.items.forEach(item => {
        const key = item.category;
        const current = categoryMap.get(key) || { needed: 0, remaining: 0 };
        const itemRemaining = Math.max(0, item.quantityNeeded - item.quantityReceived);
        
        categoryMap.set(key, {
          needed: current.needed + item.quantityNeeded,
          remaining: current.remaining + itemRemaining
        });

        // Collect keywords from unfulfilled items
        if (r.status !== RequestStatus.FULFILLED && itemRemaining > 0 && item.keywords) {
          item.keywords.forEach(k => {
             keywordMap.set(k, (keywordMap.get(k) || 0) + 1);
          });
        }
      });
    });

    const topNeededItems = Array.from(categoryMap.entries())
      .map(([name, stat]) => ({ 
        name, 
        count: stat.needed > 0 ? Math.round((stat.remaining / stat.needed) * 100) : 0 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const keywordStats = Array.from(keywordMap.entries())
      .map(([name, size]) => ({ name, size }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 20);

    // Aggregate locations
    const locMap = new Map<string, number>();
    data.forEach(r => {
      if (r.status !== RequestStatus.FULFILLED) {
         locMap.set(r.location, (locMap.get(r.location) || 0) + 1);
      }
    });

    const needsByLocation = Array.from(locMap.entries())
      .map(([location, count]) => ({ location, count }));

    // Calculate Top Urgent Regions (Top 3 by active count)
    const topUrgentRegions = [...needsByLocation]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    setStats({
      totalRequests: total,
      fulfilledRequests: fulfilled,
      pendingRequests: pending,
      topNeededItems,
      needsByLocation,
      topUrgentRegions,
      keywordStats
    });
  };

  const handleGenerateReport = async () => {
    setLoadingReport(true);
    // Prepare a lightweight JSON for the AI to save tokens
    const minifiedData = requests
      .filter(r => r.status !== RequestStatus.FULFILLED)
      .map(r => ({
        loc: r.location,
        items: r.items.map(i => ({ n: i.name, q: i.quantityNeeded - i.quantityReceived, c: i.category }))
      }));
    
    const text = await generateSituationReport(JSON.stringify(minifiedData));
    setReport(text);
    setLoadingReport(false);
  };

  const filteredRequests = filterLocation === 'All' 
    ? requests 
    : requests.filter(r => r.location === filterLocation);

  const pendingFiltered = filteredRequests.filter(r => r.status !== RequestStatus.FULFILLED);

  if (!stats) return <div className="p-8 text-center">Loading Data...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900">Needs Dashboard</h1>
           <p className="text-slate-500">Real-time overview of community requirements and distribution status.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleGenerateReport}
             className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 shadow-md shadow-purple-100 flex items-center gap-2"
           >
             {loadingReport ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-robot"></i>}
             Generate AI Situation Report
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Card 1: Total Active */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Total Active Requests</div>
          <div className="text-3xl font-bold text-slate-800">{stats.pendingRequests}</div>
          <div className="text-xs text-amber-600 mt-2 font-medium">Needs Attention</div>
        </div>
        
        {/* Card 2: Fulfilled */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Fulfilled Requests</div>
          <div className="text-3xl font-bold text-slate-800">{stats.fulfilledRequests}</div>
          <div className="text-xs text-green-600 mt-2 font-medium">Completed</div>
        </div>

        {/* Card 3: Highest Urgent Regions (NEW) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="text-sm font-medium text-slate-500 mb-2">Highest Urgent Regions</div>
          <div className="space-y-2">
             {stats.topUrgentRegions.slice(0, 3).map((item, idx) => (
               <div key={idx} className="flex justify-between items-center text-sm">
                 <span className="text-slate-700 font-medium truncate max-w-[120px]" title={item.location}>{item.location}</span>
                 <span className="text-red-600 font-bold">{item.count} Requests</span>
               </div>
             ))}
             {stats.topUrgentRegions.length === 0 && <span className="text-slate-400 italic">No data available</span>}
          </div>
        </div>

        {/* Card 4: Highest Urgent Categories */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="text-sm font-medium text-slate-500 mb-2">Highest Urgent Categories</div>
          <div className="space-y-2">
             {stats.topNeededItems.slice(0, 3).map((item, idx) => (
               <div key={idx} className="flex justify-between items-center text-sm">
                 <span className="text-slate-700 font-medium">{item.name}</span>
                 <span className="text-blue-600 font-bold">{item.count}% Unfulfilled</span>
               </div>
             ))}
             {stats.topNeededItems.length === 0 && <span className="text-slate-400 italic">No data available</span>}
          </div>
        </div>
      </div>

      {/* AI Report Section */}
      {report && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 animate-fade-in">
          <h3 className="flex items-center gap-2 font-bold text-indigo-900 mb-4">
            <i className="fa-solid fa-file-waveform"></i> AI Situation Analysis
          </h3>
          <div className="prose prose-sm text-indigo-900 max-w-none space-y-2 whitespace-pre-wrap">
            {report}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80">
          <h3 className="font-semibold text-slate-800 mb-4">Unfulfilled Needs (%) by Category</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={stats.topNeededItems}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} unit="%" domain={[0, 100]} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}} 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                formatter={(value: number) => [`${value}%`, 'Unfulfilled']}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {stats.topNeededItems.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80">
          <h3 className="font-semibold text-slate-800 mb-4">Request Distribution by Location</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={stats.needsByLocation}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                nameKey="location"
              >
                {stats.needsByLocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Treemap Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80 lg:col-span-2">
           <h3 className="font-semibold text-slate-800 mb-4">Urgent Specific Needs (Keyword Treemap)</h3>
           {stats.keywordStats.length > 0 ? (
             <ResponsiveContainer width="100%" height="90%">
              <Treemap
                data={stats.keywordStats}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#fff"
                fill="#8884d8"
                content={<CustomizedTreemapContent />}
              >
                 <Tooltip content={<CustomTreemapTooltip />} />
              </Treemap>
             </ResponsiveContainer>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <i className="fa-solid fa-tags text-2xl mb-2"></i>
                <p>No specific keyword data available yet.</p>
             </div>
           )}
        </div>
      </div>

      {/* Live Feed List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Live Request Feed</h3>
          <select 
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="text-sm bg-white text-slate-900 border-slate-300 border rounded-lg p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="All">All Locations</option>
            {stats.needsByLocation.map(l => (
              <option key={l.location} value={l.location}>{l.location}</option>
            ))}
          </select>
        </div>
        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {pendingFiltered.length === 0 ? (
             <div className="p-8 text-center text-slate-500">No active pending requests in this area.</div>
          ) : (
            pendingFiltered.map(req => (
              <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium text-slate-900">{req.location}</span>
                    <span className="text-slate-400 mx-2">•</span>
                    <span className="text-sm text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">#{req.id.slice(-4)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {req.items.map(item => {
                    const remaining = item.quantityNeeded - item.quantityReceived;
                    if (remaining <= 0) return null;
                    return (
                      <span key={item.id} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                        {item.name} ({remaining} {item.unit})
                      </span>
                    );
                  })}
                </div>
                {req.notes && <p className="text-sm text-slate-500 mt-2 italic">"{req.notes}"</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
