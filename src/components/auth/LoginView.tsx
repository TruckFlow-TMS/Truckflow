import React, { useState } from 'react';
import { Truck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input, Button } from '../ui';

export function LoginView() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex bg-canvas">
      {/* Brand panel — navy in both themes, same as the sidebar */}
      <div className="hidden lg:flex w-[44%] flex-col justify-between p-10 bg-gradient-to-b from-side-bg to-side-bg-2">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-accent-grad flex items-center justify-center">
            <Truck size={17} className="text-white" />
          </span>
          <span className="text-[15px] font-semibold text-white tracking-tight">Nune Express</span>
        </div>
        <div>
          <h2 className="text-[26px] font-semibold text-white tracking-tight leading-snug">
            Freight operations,<br />one screen.
          </h2>
          <p className="text-[13px] text-side-fg mt-3 max-w-sm leading-relaxed">
            Dispatch, drivers, fleet and billing — without the spreadsheet sprawl.
          </p>
        </div>
        <p className="text-[11px] text-side-lab">TMS v1.0</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[360px]">
          <h1 className="text-[22px] font-semibold text-fg tracking-tight">Sign in</h1>
          <p className="text-[13px] text-fg-2 mt-1 mb-6">Welcome back. Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username (e.g. admin)"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              error={localError || undefined}
            />

            <Button type="submit" className="w-full" loading={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {/* Quick-fill Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-bd">
            <p className="text-[10.5px] text-fg-3 mb-2.5 text-center uppercase tracking-wide font-semibold">
              Quick-fill demo accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => autofill('admin', 'admin')}>
                Admin
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => autofill('marcus', 'password')}>
                Dispatcher
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => autofill('sarah', 'password')}>
                Expiring
              </Button>
            </div>
          </div>

          {/* Tenant Footer Note */}
          <div className="text-[11px] text-fg-3 text-center flex items-center justify-center gap-1.5 tnum pt-5">
            <ShieldCheck size={13} className="text-pos" />
            <span>Tenant: tenant-nune-express • RLS Secured</span>
          </div>
        </div>
      </div>
    </div>
  );
}
