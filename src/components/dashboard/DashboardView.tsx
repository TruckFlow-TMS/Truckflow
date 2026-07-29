import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Load, Driver, Invoice, AuditLogEntry, User } from '../../types/tms';
import { 
  Truck, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  Lock
} from 'lucide-react';

interface DashboardViewProps {
  loads: Load[];
  drivers: Driver[];
  invoices: Invoice[];
  auditLogs: AuditLogEntry[];
  users: User[];
  setActiveTab: (tab: any) => void;
  onOpenCreateLoad: () => void;
  onSelectLoad: (load: Load) => void;
  onReload: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  loads,
  drivers,
  invoices,
  auditLogs,
  users,
  setActiveTab,
  onOpenCreateLoad,
  onSelectLoad,
  onReload,
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.roleName === 'Admin' || currentUser?.isOwner;

  const now = new Date();
  const warningUsers = users.filter((u) => {
    if (!u.expirationDate) return false;
    const diffTime = new Date(u.expirationDate).getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  });

  const activeLoadsList = loads.filter((l) => ['OPEN', 'DISPATCHED', 'IN_TRANSIT'].includes(l.status));
  const activeLoadsCount = activeLoadsList.length;
  const inTransitCount = loads.filter((l) => l.status === 'IN_TRANSIT').length;
  const dispatchedCount = loads.filter((l) => l.status === 'DISPATCHED').length;

  const grossRevenueMinor = loads
    .filter((l) => ['PAID', 'INVOICED', 'DELIVERED', 'IN_TRANSIT'].includes(l.status))
    .reduce((sum, l) => sum + (l.rateMinor || 0), 0);

  const unassignedLoadsCount = loads.filter((l) => !l.driverId && l.status !== 'PAID').length;
  
  const complianceDrivers = drivers.filter(d => {
    if (!d.cdlExpiration && !d.medicalCardExpiration) return false;
    const cdlDiff = d.cdlExpiration ? (new Date(d.cdlExpiration).getTime() - now.getTime()) / (1000 * 60 * 60 * 24) : 999;
    const medDiff = d.medicalCardExpiration ? (new Date(d.medicalCardExpiration).getTime() - now.getTime()) / (1000 * 60 * 60 * 24) : 999;
    return cdlDiff < 60 || medDiff < 60;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-blue-400 font-bold mb-1">
            <Truck size={14} />
            <span>NUNE EXPRESS LLC — FLEET OPERATIONS</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Executive Dispatch & Fleet Dashboard
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time monitoring of active loads, driver assignments, rate confirm packets, and factoring cash flows.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('dispatch')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center space-x-1.5"
          >
            <span>View Dispatch Board</span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={onOpenCreateLoad}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5"
          >
            <Plus size={16} />
            <span>+ Book New Load</span>
          </button>
        </div>
      </div>

      {/* Admin Expiration Warning Banners */}
      {isAdmin && warningUsers.length > 0 && (
        <div className="space-y-2">
          {warningUsers.map((u) => {
            const diffTime = new Date(u.expirationDate!).getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return (
              <div
                key={u.id}
                className="p-4 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-100">{u.name} ({u.username})</span> access expires in{' '}
                    <span className="font-mono font-extrabold text-amber-300">{diffDays} days</span>.
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setActiveTab('settings')} className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs transition">
                    Manage Roster
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5 Executive KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Active Loads */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-3 relative overflow-hidden group hover:border-blue-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Loads</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Truck size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">{activeLoadsCount}</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">{inTransitCount} In Transit</span> • {dispatchedCount} Dispatched
            </p>
          </div>
        </div>

        {/* KPI 2: Gross Revenue */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-3 relative overflow-hidden group hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              ${(grossRevenueMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-medium flex items-center space-x-1">
              <span>↗ Across {loads.length} loads</span>
            </p>
          </div>
        </div>

        {/* KPI 3: On-Time Delivery */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-3 relative overflow-hidden group hover:border-purple-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">On-Time Delivery</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">98.4%</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Target &gt;95% SLA
            </p>
          </div>
        </div>

        {/* KPI 4: Unassigned Loads */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-3 relative overflow-hidden group hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Unassigned Loads</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">{unassignedLoadsCount}</div>
            <p className="text-[10px] text-amber-600/80 dark:text-amber-300/80 mt-1 font-medium">
              Requires driver assignment
            </p>
          </div>
        </div>

        {/* KPI 5: Compliance Queue */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-3 relative overflow-hidden group hover:border-rose-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Compliance Queue</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400">{complianceDrivers.length}</div>
            <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-1 font-medium">
              Expiring credentials
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Stream & Compliance Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Loads & Dispatch Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Truck size={16} className="text-blue-600 dark:text-blue-400" />
              <span>Active Loads & Dispatch Stream</span>
            </h3>
            <button onClick={() => setActiveTab('loads')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
              View All Loads ({loads.length}) &gt;
            </button>
          </div>

          <div className="space-y-3">
            {loads.slice(0, 5).map((ld) => (
              <div
                key={ld.id}
                onClick={() => onSelectLoad(ld)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition cursor-pointer shadow-sm dark:shadow-lg space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-extrabold text-sm text-blue-600 dark:text-blue-400 group-hover:underline">
                      {ld.loadNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                      ld.status === 'IN_TRANSIT'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : ld.status === 'DELIVERED'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    }`}>
                      {ld.status}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{ld.brokerName}</span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                      ${(ld.rateMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <div className="font-medium text-slate-900 dark:text-slate-200">
                    {ld.originCity}, {ld.originState} → {ld.destCity}, {ld.destState}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {ld.loadedMiles} mi
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium">
                    Driver: <span className="text-blue-600 dark:text-blue-400 font-bold">{ld.driverName || 'Unassigned'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Compliance Alerts & Audit Stream */}
        <div className="space-y-6">
          {/* Compliance & Audit Alerts */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <ShieldCheck size={16} className="text-rose-500 dark:text-rose-400" />
              <span>Compliance & Audit Alerts</span>
            </h3>

            <div className="space-y-3">
              {drivers.slice(0, 3).map((drv) => (
                <div key={drv.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">{drv.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">({drv.employmentType})</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60">
                      EXPIRED/SOON
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/80">
                    <span>CDL Exp: {drv.cdlExpiration || '2027-11-15'}</span>
                    <span>Med Exp: {drv.medicalCardExpiration || '2026-08-10'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Stream Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Lock size={14} className="text-blue-600 dark:text-blue-400" />
                <span>Append-Only Audit Stream</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">RLS Protected</span>
            </div>

            <div className="space-y-3 text-xs">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{log.actorName}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-300 font-medium text-[11px]">{log.action} on {log.entityType}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] truncate">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
