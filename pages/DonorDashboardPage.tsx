import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, Treemap } from 'recharts';
import { getRequests } from '../services/storageService';

import { AidRequest, DashboardStats, RequestStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { TranslationKey } from '../translations';

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
      <div className="bg-white dark:bg-slate-800 px-3 py-2 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{payload[0].payload.name}</p>
      </div>
    );
  }
  return null;
};

export const DonorDashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requests, setRequests] = useState<AidRequest[]>([]);

  // From main branch
  const [filterLocation, setFilterLocation] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [ignoredKeywords, setIgnoredKeywords] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allRequests = await getRequests();
        setRequests(allRequests);

        // Extract all unique keywords
        const allKeywords = new Set<string>();
        allRequests.forEach(r => {
          r.items.forEach(item => {
            if (item.keywords) {
              item.keywords.forEach(k => allKeywords.add(k.toLowerCase()));
            }
          });
        });

        // Identify generic keywords
        if (allKeywords.size > 0) {
          import('../services/geminiService').then(async (service) => {
            const generic = await service.identifyGenericKeywords(Array.from(allKeywords));
            setIgnoredKeywords(prev => [...prev, ...generic.map(k => k.toLowerCase())]);
          });
        }

        calculateStats(allRequests);
      } catch (err) {
        console.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Re-calculate stats when ignoredKeywords change
  useEffect(() => {
    if (requests.length > 0) {
      calculateStats(requests);
    }
  }, [ignoredKeywords]);

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
            if (!ignoredKeywords.includes(k.toLowerCase())) {
              keywordMap.set(k, (keywordMap.get(k) || 0) + 1);
            }
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

    // Aggregate locations based on ITEM QUANTITIES
    const locMap = new Map<string, { totalNeeded: number; unfulfilledNeeded: number }>();

    data.forEach(r => {
      r.items.forEach(item => {
        const current = locMap.get(r.location) || { totalNeeded: 0, unfulfilledNeeded: 0 };
        const itemUnfulfilled = Math.max(0, item.quantityNeeded - item.quantityReceived);

        locMap.set(r.location, {
          totalNeeded: current.totalNeeded + item.quantityNeeded,
          unfulfilledNeeded: current.unfulfilledNeeded + itemUnfulfilled
        });
      });
    });

    const needsByLocation = Array.from(locMap.entries())
      .map(([location, stats]) => ({ location, count: stats.unfulfilledNeeded }));

    const locationStats = Array.from(locMap.entries())
      .map(([location, stats]) => ({
        location,
        unfulfilled: stats.unfulfilledNeeded,
        total: stats.totalNeeded,
        percentage: stats.totalNeeded > 0 ? Math.round((stats.unfulfilledNeeded / stats.totalNeeded) * 100) : 0
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 15);

    // Calculate Top Urgent Regions (Top 3 by unfulfilled count)
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
      keywordStats,
      locationStats
    });
  };

  const filteredRequests = filterLocation === 'All' || filterLocation === t('feed_all_loc')
    ? requests
    : requests.filter(r => r.location === filterLocation);

  const pendingFiltered = filteredRequests.filter(r => r.status !== RequestStatus.FULFILLED);

  // Helper to translate location strings "District - Region"
  const translateLocation = (loc: string) => {
    if (!loc) return '';
    const parts = loc.split(' - ');
    if (parts.length >= 1) {
      const districtTranslated = t(parts[0] as TranslationKey);
      if (parts.length > 1) {
        const regionTranslated = t(parts[1] as TranslationKey);
        return `${districtTranslated} - ${regionTranslated}`;
      }
      return districtTranslated;
    }
    return loc;
  };

  // Create translated copy of stats for chart rendering
  const getTranslatedStats = () => {
    if (!stats) return null;
    return {
      ...stats,
      topNeededItems: stats.topNeededItems.map(item => ({
        ...item,
        name: t(item.name as TranslationKey) // Translate Category Name
      })),
      needsByLocation: stats.needsByLocation.map(item => ({
        ...item,
        location: translateLocation(item.location)
      })),
      topUrgentRegions: stats.topUrgentRegions.map(item => ({
        ...item,
        location: translateLocation(item.location)
      })),
      locationStats: stats.locationStats.map(item => ({
        ...item,
        location: translateLocation(item.location)
      }))
    };
  };

  const translatedStats = getTranslatedStats();

  if (isLoading || !stats || !translatedStats) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading Dashboard Data...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('dash_title')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('dash_subtitle')}</p>
        </div>
        <div className="flex gap-2">
        </div>

      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Card 1: Total Active */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t('kpi_active')}</div>
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.pendingRequests}</div>
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">{t('kpi_attention')}</div>
        </div>

        {/* Card 2: Fulfilled */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t('kpi_fulfilled')}</div>
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.fulfilledRequests}</div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">{t('kpi_completed')}</div>
        </div>

        {/* Card 3: Highest Urgent Regions (NEW) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center transition-colors">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{t('kpi_urgent_regions')}</div>
          <div className="space-y-2">
            {translatedStats.topUrgentRegions.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-slate-700 dark:text-slate-200 font-medium truncate flex-1 min-w-0 pr-2" title={item.location}>{item.location}</span>
                <span className="text-red-600 dark:text-red-400 font-bold whitespace-nowrap">{item.count} {t('lbl_requests')}</span>
              </div>
            ))}
            {translatedStats.topUrgentRegions.length === 0 && <span className="text-slate-400 dark:text-slate-500 italic">No data available</span>}
          </div>
        </div>

        {/* Card 4: Highest Urgent Categories */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center transition-colors">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{t('kpi_urgent_cats')}</div>
          <div className="space-y-2">
            {translatedStats.topNeededItems.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-slate-700 dark:text-slate-200 font-medium truncate flex-1 min-w-0 pr-2" title={item.name}>{item.name}</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold whitespace-nowrap">{item.count}% {t('lbl_unfulfilled')}</span>
              </div>
            ))}
            {translatedStats.topNeededItems.length === 0 && <span className="text-slate-400 dark:text-slate-500 italic">No data available</span>}
          </div>
        </div>
      </div>



      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-80 transition-colors">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">{t('chart_unfulfilled')}</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={translatedStats.topNeededItems}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} unit="%" domain={[0, 100]} />
              <Tooltip
                cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }}
                itemStyle={{ color: '#1e293b' }}
                formatter={(value: number) => [`${value}%`, t('lbl_unfulfilled')]}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {translatedStats.topNeededItems.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Location Bar Chart (Replaces Pie Chart) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-80 transition-colors">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">{t('chart_location')}</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={translatedStats.locationStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} unit="%" domain={[0, 100]} />
              <YAxis dataKey="location" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }}
                itemStyle={{ color: '#1e293b' }}
                formatter={(value: number, name: string, props: any) => [
                  `${value}%`,
                  `Unfulfilled (${props.payload.unfulfilled}/${props.payload.total})`
                ]}
              />
              <Bar dataKey="percentage" fill="#10b981" radius={[0, 4, 4, 0]}>
                {translatedStats.locationStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Treemap Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-80 lg:col-span-2 transition-colors">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">{t('chart_treemap')}</h3>
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
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <i className="fa-solid fa-tags text-2xl mb-2"></i>
              <p>No specific keyword data available yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Live Feed List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t('feed_title')}</h3>
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 border rounded-lg p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="All">{t('feed_all_loc')}</option>
            {stats.needsByLocation.map(l => (
              <option key={l.location} value={l.location}>{translateLocation(l.location)}</option>
            ))}
          </select>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[500px] overflow-y-auto">
          {pendingFiltered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('feed_empty')}</div>
          ) : (
            pendingFiltered.map(req => (
              <div key={req.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium text-slate-900 dark:text-slate-200">{translateLocation(req.location)}</span>
                    <span className="text-slate-400 mx-2">•</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500">#{req.id.slice(-4)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {req.items.map(item => {
                    const remaining = item.quantityNeeded - item.quantityReceived;
                    if (remaining <= 0) return null;
                    return (
                      <span key={item.id} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/50">
                        {item.name} ({remaining} {t(item.unit as TranslationKey)})
                      </span>
                    );
                  })}
                </div>
                {req.notes && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 italic">"{req.notes}"</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};