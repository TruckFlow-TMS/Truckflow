import React from 'react';
import {
  LayoutDashboard, Kanban, Package, Users, Truck, Building2,
  DollarSign, BarChart3, Settings,
} from 'lucide-react';
import { cn } from '../../lib/cn';

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
  /** Owned by App so the Header's toggle and this panel stay in step. */
  collapsed: boolean;
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

/**
 * Rail geometry. The widths and paddings are chosen so an icon's centre lands
 * at ~28px from the sidebar's left edge in *both* states (expanded: 10px aside
 * padding + 10px button padding + 7.5px half-icon; collapsed: 8px aside padding
 * + half of the 40px button). The icons therefore hold still while the panel
 * animates — the width change reads as the labels sliding away, not as the
 * whole nav jumping sideways. Changing any of these four paddings means
 * re-checking that arithmetic.
 */
const EASE = 'ease-[cubic-bezier(0.32,0.72,0,1)]';

/**
 * Labels fade out fast on collapse (the space is disappearing under them) but
 * fade in late on expand, so text never renders into a column too narrow to
 * hold it. The asymmetry is what keeps the transition from looking cheap.
 */
const label = (collapsed: boolean) =>
  cn(
    'min-w-0 truncate text-left transition-[margin,opacity] motion-reduce:transition-none',
    // `flex-none w-0` rather than a grown-but-empty box: a `flex-1` label keeps
    // claiming the leftover width, which leaves `justify-center` nothing to
    // centre and pins the icons to the left edge of the rail.
    collapsed
      ? 'flex-none w-0 ml-0 opacity-0 duration-100'
      : 'flex-1 ml-2.5 opacity-100 duration-200 delay-150',
  );

export function Sidebar({ activeTab, setActiveTab, loadCount = 0, collapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        'h-screen shrink-0 flex flex-col gap-px py-3.5 select-none',
        'bg-gradient-to-b from-side-bg to-side-bg-2',
        'transition-[width,padding] duration-300 motion-reduce:transition-none',
        EASE,
        collapsed ? 'w-[56px] px-2' : 'w-[228px] px-2.5',
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex items-center pt-0.5 pb-1.5 transition-[padding] duration-300 motion-reduce:transition-none',
          EASE,
          collapsed ? 'px-0 justify-center' : 'px-2',
        )}
      >
        <span className="w-7 h-7 rounded-lg bg-accent-grad flex items-center justify-center shrink-0 shadow-lg shadow-accent/40">
          <Truck size={15} className="text-white" />
        </span>
        <div className={label(collapsed)}>
          <div className="text-[13.5px] font-semibold text-white tracking-tight truncate">
            TruckFlow
          </div>
          {/* The product is TruckFlow; the second line is the carrier operating
              in it. It was the raw tenant id, which read as debug output. */}
          <div className="text-[10px] text-side-lab truncate">
            Nune Express
          </div>
        </div>
      </div>

      <div className="h-px bg-side-bd/[0.08] mx-1.5 my-2" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto flex flex-col gap-px">
        {GROUPS.map((group, gi) => (
          <React.Fragment key={group.heading}>
            {/* Collapsed, the heading text is useless in a 40px column, so the
                group reads as a hairline rule instead. Both states carry a
                fixed height so the rows below don't jump mid-animation. */}
            <div
              className={cn(
                'relative px-2 overflow-hidden transition-[height] duration-300 motion-reduce:transition-none',
                EASE,
                collapsed ? 'h-[14px]' : 'h-[28px]',
              )}
            >
              <p
                className={cn(
                  'pt-2.5 pb-1 leading-[14px] text-[9.5px] font-semibold uppercase',
                  'tracking-[0.09em] text-side-lab whitespace-nowrap',
                  'transition-opacity motion-reduce:transition-none',
                  collapsed ? 'opacity-0 duration-100' : 'opacity-100 duration-200 delay-150',
                )}
              >
                {group.heading}
              </p>
              {gi > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-[6px] left-2 right-2 h-px bg-side-bd/[0.1]',
                    'transition-opacity duration-200 motion-reduce:transition-none',
                    collapsed ? 'opacity-100 delay-150' : 'opacity-0 duration-100',
                  )}
                />
              )}
            </div>

            {group.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'relative w-full flex items-center py-[7px] rounded-ctl',
                    'text-[13.5px] font-medium transition-[background-color,color,padding] duration-300',
                    'motion-reduce:transition-none',
                    EASE,
                    collapsed ? 'px-0 justify-center' : 'px-2.5',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-2',
                    isActive
                      ? 'bg-side-active/20 text-side-fg-on font-semibold'
                      : 'text-side-fg hover:bg-side-hover/5 hover:text-white',
                  )}
                >
                  {isActive && (
                    <span
                      className={cn(
                        'absolute top-[7px] bottom-[7px] w-[3px] rounded-r bg-accent-2',
                        'transition-[left] duration-300 motion-reduce:transition-none',
                        EASE,
                        collapsed ? '-left-2' : '-left-2.5',
                      )}
                    />
                  )}
                  <span className="shrink-0">{item.icon}</span>
                  <span className={label(collapsed)}>{item.label}</span>
                  {item.badge && loadCount > 0 && (
                    collapsed ? (
                      // The count has nowhere to live in the rail; a dot keeps
                      // the "there is something here" signal without reflowing
                      // the row and shoving the icon off-centre.
                      <span
                        aria-hidden="true"
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent-2"
                      />
                    ) : (
                      <span className="ml-2 text-[10px] font-semibold px-1.5 py-px rounded-full bg-white/[0.13] text-white tnum shrink-0">
                        {loadCount}
                      </span>
                    )
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
