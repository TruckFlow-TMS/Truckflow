import React, { useState } from 'react';
import { Truck, Eye, EyeOff, AlertCircle, User, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function LoginView() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setLocalError('Please enter both username and password.');
      return;
    }
    
    setLocalError('');
    setIsLoading(true);
    
    try {
      await login(username, password);
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const autofill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setLocalError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden select-none">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Login Card */}
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800 p-8 space-y-6 relative z-10">
        
        {/* Branding & Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 shadow-lg shadow-blue-600/20 mb-1">
            <Truck size={30} />
          </div>
          
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-white tracking-wide">NUNE EXPRESS</h1>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono font-bold border border-blue-500/30">
              TMS V1.0
            </span>
          </div>

          <h2 className="text-sm font-semibold text-slate-200">Sign In to Your Account</h2>
          <p className="text-xs text-slate-400 max-w-xs">
            Enter your credentials to access the dispatch system & operational dashboard.
          </p>
        </div>

        {/* Auth Alert Box */}
        {localError && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-start space-x-2.5 shadow-lg animate-in fade-in duration-200">
            <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{localError}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User size={16} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter username (e.g. admin)"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition disabled:opacity-50 flex justify-center items-center mt-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        {/* Quick-fill Demo Accounts */}
        <div className="pt-4 border-t border-slate-800/80">
          <p className="text-[10px] text-slate-400 mb-2.5 text-center uppercase tracking-wider font-bold">
            Quick-Fill Demo Accounts
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => autofill('admin', 'admin')}
              className="px-2.5 py-2 text-[11px] bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition border border-slate-800 text-center font-medium"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => autofill('marcus', 'password')}
              className="px-2.5 py-2 text-[11px] bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition border border-slate-800 text-center font-medium"
            >
              Dispatcher
            </button>
            <button
              type="button"
              onClick={() => autofill('sarah', 'password')}
              className="px-2.5 py-2 text-[11px] bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition border border-slate-800 text-center font-medium"
            >
              Expiring Account
            </button>
          </div>
        </div>

        {/* Tenant Footer Note */}
        <div className="text-[10px] text-slate-400 text-center flex items-center justify-center space-x-1.5 font-mono pt-1">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>Tenant: tenant-nune-express • RLS Secured</span>
        </div>

      </div>
    </div>
  );
}
