import React, { useEffect, useRef, useState } from 'react';
import {
  Search, Moon, Sun, Bell, LogOut, ChevronDown, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function Header({ sidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  // Escape and outside-click close the menu. Escape returns focus to the
  // trigger — without that, closing by keyboard drops focus onto <body> and
  // the next Tab restarts from the top of the page.
  useEffect(() => {
    if (!menuOpen) return;

    firstItemRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenuOpen(false);
      triggerRef.current?.focus();
    };
    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [menuOpen]);

  const iconBtn =
    'w-[33px] h-[33px] rounded-ctl border border-bd bg-surface text-fg-2 ' +
    'flex items-center justify-center relative transition-colors hover:text-fg hover:bg-surface-2 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

  return (
    <header className="h-[54px] shrink-0 bg-topbar border-b border-bd flex items-center gap-3.5 px-4 select-none">
      {/* Sits ahead of everything else: it acts on the panel to its left, so
          it reads as belonging to that edge rather than to the toolbar. */}
      <button
        onClick={onToggleSidebar}
        aria-expanded={!sidebarCollapsed}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={iconBtn}
      >
        {sidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
      </button>

      <div className="relative flex-1 max-w-[340px]">
        <Search size={14} aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none" />
        <input
          type="search"
          aria-label="Search loads, drivers, brokers"
          placeholder="Search loads, drivers, brokers…"
          className="w-full h-[33px] pl-8 pr-3 bg-surface-2 border border-bd rounded-ctl text-[12.5px] text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
        />
      </div>

      {/* Everything else sits together on the right. */}
      <div className="ml-auto flex items-center gap-2.5">
        <button className={iconBtn} aria-label="Notifications">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-danger ring-2 ring-surface" />
        </button>

        <button
          onClick={toggleTheme}
          className={iconBtn}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div ref={wrapRef} className="relative">
          <button
            ref={triggerRef}
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Account menu for ${currentUser?.name ?? 'user'}`}
            className="flex items-center gap-2.5 h-[37px] pl-1.5 pr-2 rounded-ctl transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Avatar name={currentUser?.name ?? 'User'} size={29} className="rounded-lg" />
            <span className="hidden lg:block text-right leading-tight">
              <span className="block text-[12px] font-semibold text-fg">{currentUser?.name ?? '—'}</span>
              <span className="block text-[10.5px] text-fg-3">{currentUser?.roleName ?? ''}</span>
            </span>
            <ChevronDown size={14} aria-hidden="true" className="text-fg-3" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              aria-label="Account"
              className="absolute right-0 top-[calc(100%+6px)] z-50 w-[212px] p-1 rounded-card bg-surface border border-bd shadow-lift"
            >
              {/* Identity moved here from the sidebar footer, so the name still
                  has a home once the menu is the only place it appears. */}
              <div className="px-2.5 py-2 border-b border-bd mb-1">
                <p className="text-[12px] font-semibold text-fg truncate">{currentUser?.name ?? '—'}</p>
                <p className="text-[10.5px] text-fg-3 truncate">{currentUser?.email ?? currentUser?.roleName ?? ''}</p>
              </div>

              <button
                ref={firstItemRef}
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-[7px] rounded-ctl text-[12.5px] font-medium text-fg-2 text-left transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <LogOut size={14} aria-hidden="true" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
