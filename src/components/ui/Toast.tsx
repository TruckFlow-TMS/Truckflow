import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Live region: toasts are the only confirmation for saves, deletes and
          failures, so they have to be announced rather than just drawn.
          `polite` waits for a pause in speech; errors escalate to `assertive`
          on the toast itself. */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={cn(
              'flex items-start gap-2.5 px-3.5 py-2.5 rounded-card border shadow-lift text-[12.5px] font-medium min-w-[260px]',
              toast.type === 'success' && 'bg-pos-bg border-pos/20 text-pos',
              toast.type === 'error' && 'bg-danger-bg border-danger/20 text-danger',
              toast.type === 'info' && 'bg-accent-weak border-accent/20 text-accent',
            )}
          >
            <div className="flex-shrink-0" aria-hidden="true">
              {toast.type === 'success' && <CheckCircle size={18} />}
              {toast.type === 'error' && <XCircle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </div>
            <div className="flex-1">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity rounded-ctl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
