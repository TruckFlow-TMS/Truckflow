import React, { useEffect, useRef, useState } from 'react';
import {
  Search, Moon, Sun, Bell, LogOut, ChevronDown, PanelLeftClose, PanelLeftOpen,
  AlertTriangle, ShieldCheck, X, Settings,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { User, Driver } from '../../types/tms';

export interface Notification {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
  read: boolean;
  timestamp: Date;
}

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  notifications?: Notification[];
  onDismissNotification?: (id: string) => void;
  onMarkAllRead?: () => void;
}

export function Header({
  sidebarCollapsed,
  onToggleSidebar,
  notifications = [],
  onDismissNotification,
  onMarkAllRead,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const notiWrapRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Escape and outside-click close menus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (menuOpen) {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
      if (notiOpen) setNotiOpen(false);
    };
    const onPointerDown = (e: MouseEvent) => {
      if (menuOpen && !wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
      if (notiOpen && !notiWrapRef.current?.contains(e.target as Node)) setNotiOpen(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [menuOpen, notiOpen]);

  useEffect(() => {
    if (menuOpen) firstItemRef.current?.focus();
  }, [menuOpen]);

  const iconBtn =
    'w-[33px] h-[33px] rounded-ctl border border-bd bg-surface text-fg-2 ' +
    'flex items-center justify-center relative transition-colors hover:text-fg hover:bg-surface-2 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

  const notiIcon = (type: string) => {
    if (type === 'danger') return <ShieldCheck size={14} className="text-danger shrink-0" />;
    if (type === 'warning') return <AlertTriangle size={14} className="text-warn shrink-0" />;
    return <Bell size={14} className="text-accent shrink-0" />;
  };

  const notiBg = (type: string) => {
    if (type === 'danger') return 'bg-danger-bg border-danger/20';
    if (type === 'warning') return 'bg-warn-bg border-warn/20';
    return 'bg-accent-weak border-accent/20';
  };

  return (
    <header className="h-[54px] shrink-0 bg-topbar border-b border-bd flex items-center gap-3.5 px-4 select-none">
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        aria-expanded={!sidebarCollapsed}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={iconBtn}
      >
        {sidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
      </button>

      {/* Search bar — expanded to fill available space */}
      <div className="relative flex-1">
        <Search size={14} aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none" />
        <input
          type="search"
          aria-label="Search loads, drivers, brokers"
          placeholder="Search loads, drivers, brokers…"
          className="w-full h-[33px] pl-8 pr-3 bg-surface-2 border border-bd rounded-ctl text-[12.5px] text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
        />
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Notification bell */}
        <div ref={notiWrapRef} className="relative">
          <button
            className={iconBtn}
            aria-label="Notifications"
            onClick={() => setNotiOpen((o) => !o)}
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white ring-2 ring-topbar">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {notiOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[360px] rounded-card bg-surface border border-bd shadow-lift overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-bd">
                <h3 className="text-[13px] font-semibold text-fg">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllRead}
                      className="text-[11px] text-accent hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell size={24} className="mx-auto text-fg-3 mb-2" />
                    <p className="text-[12.5px] text-fg-3">No notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-3.5 py-3 border-b border-bd last:border-b-0 transition-colors ${
                        n.read ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`mt-0.5 w-7 h-7 rounded-ctl flex items-center justify-center border ${notiBg(n.type)}`}>
                          {notiIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12px] font-semibold text-fg truncate">{n.title}</p>
                            {onDismissNotification && (
                              <button
                                onClick={() => onDismissNotification(n.id)}
                                className="text-fg-3 hover:text-fg transition-colors shrink-0"
                                aria-label="Dismiss"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                          <p className="text-[11.5px] text-fg-2 mt-0.5 leading-relaxed">{n.message}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-fg-3 tnum">
                              {n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {n.action && (
                              <button
                                onClick={() => {
                                  n.action!.onClick();
                                  setNotiOpen(false);
                                }}
                                className="text-[11px] text-accent font-semibold hover:underline"
                              >
                                {n.action.label}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={iconBtn}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Account menu */}
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
