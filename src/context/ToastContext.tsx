import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep max 5 toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* Floating Toasts Container */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-200 ${
                isSuccess
                  ? 'bg-[#0e1f17]/95 border-emerald-500/40 text-emerald-200'
                  : isError
                  ? 'bg-[#220c0e]/95 border-red-500/40 text-red-200'
                  : isWarning
                  ? 'bg-[#241708]/95 border-amber-500/40 text-amber-200'
                  : 'bg-[#121212]/95 border-slate-700/80 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {isError && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-[#FF4D00] shrink-0" />}

                <span className="text-xs font-bold leading-snug break-words">
                  {toast.message}
                </span>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                title="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser utilizado dentro de um ToastProvider');
  }
  return context;
};
