import React from 'react';
import { Load } from '../../types/tms';
import { BarChart3, TrendingUp, Download } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ReportsViewProps {
  loads: Load[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ loads }) => {
  const chartData = loads.map((l) => ({
    name: l.loadNumber,
    revenue: l.rateMinor / 100,
    loadedMiles: l.loadedMiles,
    deadheadMiles: l.deadheadMiles,
  }));

  const totalLoaded = loads.reduce((sum, l) => sum + l.loadedMiles, 0);
  const totalDeadhead = loads.reduce((sum, l) => sum + l.deadheadMiles, 0);
  const totalMiles = totalLoaded + totalDeadhead || 1;
  const deadheadPercentage = ((totalDeadhead / totalMiles) * 100).toFixed(1);

  const handleExportCSV = () => {
    const headers = 'LoadNumber,Broker,Status,GrossRateUSD,LoadedMiles,DeadheadMiles\n';
    const rows = loads
      .map((l) => `${l.loadNumber},"${l.brokerName}",${l.status},${(l.rateMinor / 100).toFixed(2)},${l.loadedMiles},${l.deadheadMiles}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nune_Express_TMS_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Profitability & Operational Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Revenue per loaded mile, deadhead share, broker margins, & truck profitability.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center space-x-2 self-start sm:self-auto shadow-sm"
        >
          <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Distance Traveled</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalMiles.toLocaleString()} mi</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{totalLoaded.toLocaleString()} loaded mi</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Deadhead Share %</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{deadheadPercentage}%</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1">Non-revenue cost miles ({totalDeadhead} mi)</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg Revenue / Loaded Mile</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ${totalLoaded ? ((loads.reduce((s, l) => s + l.rateMinor, 0) / 100) / totalLoaded).toFixed(2) : '0.00'}
          </div>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">Target &gt; $3.20 / mi</p>
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Gross Rate ($) per Load Comparison</span>
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px', color: '#fff' }}
                formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Gross Rate']}
              />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
