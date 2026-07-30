import React from 'react';
import {
  LayoutDashboard, Kanban, Package, Users, Truck, Building2,
  DollarSign, BarChart3, Settings,
} from 'lucide-react';
import { cn } from '../../lib/cn';
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

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ReactNode;
  badge?: boolean;
}

/** All 9 sections, original ids/labels/order. Groups are display-only. */
const GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
      { id: 'dispatch', label: 'Dispatch Board', icon: <Kanban size={15} /> },
      { id: 'loads', label: 'Loads', icon: <Package size={15} />, badge: true },
    ],
  },
  {
    heading: 'Resources',
    items: [
      { id: 'drivers', label: 'Drivers', icon: <Users size={15} /> },
      { id: 'fleet', label: 'Fleet & Equipment', icon: <Truck size={15} /> },
      { id: 'customers', label: 'Brokers & Customers', icon: <Building2 size={15} /> },
    ],
  },
  {
    heading: 'Revenue',
    items: [
      { id: 'invoices', label: 'Billing & Factoring', icon: <DollarSign size={15} /> },
      { id: 'reports', label: 'Reports & Profitability', icon: <BarChart3 size={15} /> },
    ],
  },
  {
    heading: 'Administration',
    items: [
      { id: 'settings', label: 'Settings & Roles', icon: <Settings size={15} /> },
    ],
  },
];

export function Sidebar({ activeTab, setActiveTab, loadCount = 0 }: SidebarProps) {
  const { currentUser } = useAuth();

  return (
    <aside className="w-[228px] h-screen shrink-0 flex flex-col gap-px px-2.5 py-3.5 select-none bg-gradient-to-b from-side-bg to-side-bg-2">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pt-0.5 pb-1.5">
        <span className="w-7 h-7 rounded-lg bg-accent-grad flex items-center justify-center shrink-0 shadow-lg shadow-accent/40">
          <Truck size={15} className="text-white" />
        </span>
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold text-white tracking-tight truncate">
            Nune Express
          </div>
          <div className="text-[10px] text-side-lab truncate">
            {currentUser?.tenantId ?? 'tenant-nune-express'}
          </div>
        </div>
      </div>

      <div className="h-px bg-side-bd/[0.08] mx-1.5 my-2" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto flex flex-col gap-px">
        {GROUPS.map((group) => (
          <React.Fragment key={group.heading}>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-side-lab px-2 pt-2.5 pb-1">
              {group.heading}
            </p>
            {group.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-ctl',
                    'text-[13.5px] font-medium text-left transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-2',
                    isActive
                      ? 'bg-side-active/20 text-side-fg-on font-semibold'
                      : 'text-side-fg hover:bg-side-hover/5 hover:text-white',
                  )}
                >
                  {isActive && (
                    <span className="absolute -left-2.5 top-[7px] bottom-[7px] w-[3px] rounded-r bg-accent-2" />
                  )}
                  <span className="shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                  {item.badge && loadCount > 0 && (
                    <span className="ml-auto text-[10px] font-semibold px-1.5 py-px rounded-full bg-white/[0.13] text-white tnum shrink-0">
                      {loadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </nav>
    </aside>
  );
}
