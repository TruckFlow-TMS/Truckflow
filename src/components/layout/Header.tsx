import React from 'react';
import { Search, Moon, Sun, Bell, LogOut, Plus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';

interface HeaderProps {
  onOpenCreateLoad?: () => void;
}

export function Header({ onOpenCreateLoad }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();

  const iconBtn =
    'w-[33px] h-[33px] rounded-ctl border border-bd bg-surface text-fg-2 ' +
    'flex items-center justify-center relative transition-colors hover:text-fg hover:bg-surface-2 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

  return (
    <header className="h-[54px] shrink-0 bg-surface border-b border-bd flex items-center gap-3.5 px-4 select-none">
      <div className="relative flex-1 max-w-[340px]">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Search loads, drivers, brokers…"
          className="w-full h-[33px] pl-8 pr-3 bg-surface-2 border border-bd rounded-ctl text-[12.5px] text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
        />
      </div>

      {onOpenCreateLoad && (
        <Button onClick={onOpenCreateLoad} icon={<Plus size={13} />} className="hidden sm:inline-flex">
          New load
        </Button>
      )}

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

      <div className="ml-auto flex items-center gap-2.5">
        <div className="hidden lg:block text-right leading-tight">
          <p className="text-[12px] font-semibold text-fg">{currentUser?.name ?? '—'}</p>
          <p className="text-[10.5px] text-fg-3">{currentUser?.roleName ?? ''}</p>
        </div>
        <Avatar name={currentUser?.name ?? 'User'} size={29} className="rounded-lg" />
        <button onClick={logout} className={iconBtn} aria-label="Log out" title="Log out">
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
