
import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, Clock } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  timestamp: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  notifications: Toast[]; // Expose history
  clearNotifications: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [history, setHistory] = useState<Toast[]>([]); // Store all notifications for the bell menu
  const lastAddedRef = useRef<{ [key: string]: number }>({});
  const activeToastsRef = useRef<Toast[]>([]);

  // Keep activeToastsRef in sync with toasts state
  useEffect(() => {
    activeToastsRef.current = toasts;
  }, [toasts]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(({ type, title, message, duration = 5000, action }: Omit<Toast, 'id' | 'timestamp'>) => {
    const now = Date.now();
    const cleanTitle = title.trim();
    const cleanMessage = message?.trim() || '';
    const contentKey = `${type}:${cleanTitle}:${cleanMessage}`.toLowerCase();
    
    // 1. Ref-based deduplication (handles rapid fire calls within 3 seconds)
    if (lastAddedRef.current[contentKey] && now - lastAddedRef.current[contentKey] < 3000) {
      console.log('Skipping duplicate toast (ref):', contentKey);
      return;
    }
    
    // 2. Prevent adding if the exact same toast is already visible on screen
    if (activeToastsRef.current.some(t => 
      t.type === type && 
      t.title.trim().toLowerCase() === cleanTitle.toLowerCase() && 
      (t.message?.trim().toLowerCase() || '') === cleanMessage.toLowerCase()
    )) {
      console.log('Skipping duplicate toast (active):', contentKey);
      return;
    }
    
    lastAddedRef.current[contentKey] = now;
    
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { 
      id, 
      type, 
      title: cleanTitle, 
      message: cleanMessage || undefined, 
      duration, 
      action, 
      timestamp: now 
    };
    
    setToasts((prev) => {
      // Final state-based check to prevent duplicates in the same render cycle
      const isDuplicate = prev.some(t => 
        t.type === type && 
        t.title.trim().toLowerCase() === cleanTitle.toLowerCase() && 
        (t.message?.trim().toLowerCase() || '') === cleanMessage.toLowerCase()
      );
      
      if (isDuplicate) {
        console.warn('[Toast] Blocking duplicate state update for:', contentKey);
        return prev;
      }

      console.log('[Toast] Adding new toast:', contentKey);
      return [...prev, newToast];
    });

    setHistory((prev) => {
      // Prevent duplicate in history if it's exactly the same and very recent (5s)
      const isDuplicate = prev.length > 0 && 
                         prev[0].title.trim().toLowerCase() === cleanTitle.toLowerCase() && 
                         (prev[0].message?.trim().toLowerCase() || '') === cleanMessage.toLowerCase() && 
                         now - prev[0].timestamp < 5000;
      
      if (isDuplicate) return prev;
      return [newToast, ...prev].slice(0, 20);
    });

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const clearNotifications = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, notifications: history, clearNotifications }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md min-w-[300px] max-w-[400px] animate-in slide-in-from-right-full fade-in duration-300 ${
              toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
              toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' :
              toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' :
              'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'warning' && <AlertTriangle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-sm">{toast.title}</h4>
                <span className="text-[10px] font-medium opacity-50 whitespace-nowrap">
                  {new Date(toast.timestamp).toDateString() === new Date().toDateString() 
                    ? new Date(toast.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : new Date(toast.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
              {toast.message && <p className="text-xs opacity-80 mt-1">{toast.message}</p>}
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.onClick();
                    removeToast(toast.id);
                  }}
                  className="mt-2 text-xs font-black uppercase tracking-widest underline decoration-2 underline-offset-4 hover:opacity-70 transition-opacity"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
