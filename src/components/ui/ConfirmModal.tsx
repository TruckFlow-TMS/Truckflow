import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen?: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isDanger?: boolean;
}

export function ConfirmModal({
  isOpen = true,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  isLoading = false,
  isDanger = true
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-gray-900 dark:text-white font-semibold">
            {isDanger && <AlertTriangle size={20} className="text-red-500" />}
            <h3 className="text-lg">{title}</h3>
          </div>
          <button 
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 dark:text-slate-300 text-sm">
            {message}
          </p>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 flex justify-end space-x-3 border-t border-gray-200 dark:border-slate-800">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-white text-sm font-medium flex items-center transition-colors ${
              isDanger 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            } disabled:opacity-70`}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
