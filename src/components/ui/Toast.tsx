import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

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
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start p-4 rounded-lg shadow-lg border max-w-sm w-full animate-in slide-in-from-right-8 duration-300 ${
              toast.type === 'success' 
                ? 'bg-white dark:bg-slate-900 border-green-200 dark:border-green-900/50' 
                : toast.type === 'error'
                ? 'bg-white dark:bg-slate-900 border-red-200 dark:border-red-900/50'
                : 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/50'
            }`}
          >
            <div className="flex-shrink-0 mr-3">
              {toast.type === 'success' && <CheckCircle className="text-green-500" size={20} />}
              {toast.type === 'error' && <XCircle className="text-red-500" size={20} />}
              {toast.type === 'info' && <Info className="text-blue-500" size={20} />}
            </div>
            <div className="flex-1 mr-2 text-sm text-gray-800 dark:text-slate-200">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={16} />
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
