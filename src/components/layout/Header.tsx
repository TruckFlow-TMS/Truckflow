import React from 'react';
import { Search, Moon, Sun, Bell, LogOut, SlidersHorizontal, Plus, Truck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenCreateLoad?: () => void;
}

export function Header({ onOpenCreateLoad }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 select-none shadow-sm dark:shadow-md transition-colors duration-200 shrink-0">
      {/* Left: Global Search Bar */}
      <div className="flex items-center space-x-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={15} />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl leading-5 bg-slate-100 dark:bg-slate-950/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs transition"
            placeholder="Search loads, drivers, trucks, rate cons, or brokers..."
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {onOpenCreateLoad && (
          <button
            onClick={onOpenCreateLoad}
            className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition"
          >
            <Plus size={15} />
            <span>+ New Load</span>
          </button>
        )}

        <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">
          <SlidersHorizontal size={18} />
        </button>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center justify-center"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun size={18} className="text-amber-400 animate-pulse" />
          ) : (
            <Moon size={18} className="text-slate-700" />
          )}
        </button>

        <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

        {/* User Pill */}
        <div className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="h-7 w-7 rounded-full bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
            {currentUser?.name?.charAt(0) || 'N'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-slate-900 dark:text-white font-bold text-xs leading-tight">{currentUser?.name || 'Nune Harutyunyan (Admin)'}</p>
            <p className="text-blue-600 dark:text-blue-400 text-[10px] font-mono leading-tight">{currentUser?.roleName || 'Admin'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
