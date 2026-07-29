import React from 'react';
import { 
  LayoutDashboard, 
  Kanban,
  Package, 
  Users, 
  Truck, 
  Building2, 
  DollarSign, 
  BarChart3,
  Settings,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab = 
  | 'dashboard' 
  | 'dispatch' 
  | 'loads' 
  | 'drivers' 
  | 'fleet' 
  | 'customers' 
  | 'invoices' 
  | 'reports' 
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  loadCount?: number;
}

export function Sidebar({ activeTab, setActiveTab, loadCount = 1 }: SidebarProps) {
  const { currentUser } = useAuth();
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'dispatch', label: 'Dispatch Board', icon: <Kanban size={18} /> },
    { id: 'loads', label: 'Loads', icon: <Package size={18} />, badge: loadCount },
    { id: 'drivers', label: 'Drivers', icon: <Users size={18} /> },
    { id: 'fleet', label: 'Fleet & Equipment', icon: <Truck size={18} /> },
    { id: 'customers', label: 'Brokers & Customers', icon: <Building2 size={18} /> },
    { id: 'invoices', label: 'Billing & Factoring', icon: <DollarSign size={18} /> },
    { id: 'reports', label: 'Reports & Profitability', icon: <BarChart3 size={18} /> },
    { id: 'settings', label: 'Settings & Roles', icon: <Settings size={18} /> },
  ];

  return (
    <aside className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between select-none shrink-0 transition-colors duration-200">
      <div className="flex flex-col min-h-0 flex-1">
        {/* Top Branding Section aligned with Header (h-16) */}
        <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 shrink-0">
            <Truck size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-slate-900 dark:text-white text-xs tracking-wider truncate">NUNE EXPRESS</span>
              <span className="text-[9px] bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">TMS V1.0</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
              Tenant ID: {currentUser?.tenantId || 'tenant-nune-express'}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="p-4 space-y-1 overflow-y-auto flex-1">
          <p className="px-3 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2">Main Navigation</p>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as NavTab)}
                className={`w-full h-10 px-3.5 rounded-xl transition flex items-center justify-between gap-3 text-xs font-semibold ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                
                <div className="flex items-center space-x-2 shrink-0">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] py-0.5 px-2 rounded-full font-mono font-bold ${
                      isActive 
                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={14} className="text-blue-600 dark:text-blue-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Bottom Tenant Info Card */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-inner">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-200 text-xs">Tenant Active</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            Recourse Factoring enabled. Multi-stop dispatch active.
          </p>
        </div>
      </div>
    </aside>
  );
}
