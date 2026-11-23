import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 items-center pointer-events-none w-full max-w-sm px-4 box-border">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, y: -20, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-center gap-3 px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl shadow-2xl border backdrop-blur-md w-full box-border ${
                toast.type === 'success' ? 'bg-emerald-50/90 border-emerald-100 text-emerald-900' :
                toast.type === 'error' ? 'bg-rose-50/90 border-rose-100 text-rose-900' :
                toast.type === 'warning' ? 'bg-orange-50/95 border-orange-200 text-orange-950 shadow-orange-100/50' :
                'bg-blue-50/90 border-blue-100 text-blue-900'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
              {toast.type === 'error' && <AlertCircle size={18} className="text-rose-500" />}
              {toast.type === 'warning' && <AlertTriangle size={18} className="text-orange-500" />}
              {toast.type === 'info' && <Info size={18} className="text-blue-500" />}
              
              <p className="text-[10px] font-black uppercase tracking-widest flex-1">{toast.message}</p>
              
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X size={14} />
              </button>
              
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: 0 }}
                transition={{ duration: 4, ease: 'linear' }}
                onAnimationComplete={() => removeToast(toast.id)}
                className={`absolute bottom-0 left-0 h-1 ${
                  toast.type === 'success' ? 'bg-emerald-500' :
                  toast.type === 'error' ? 'bg-rose-500' :
                  toast.type === 'warning' ? 'bg-orange-500' :
                  'bg-blue-500'
                }`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
