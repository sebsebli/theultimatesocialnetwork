import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Toast, type ToastType } from '../components/Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType; id: number } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);

  const value = useMemo(() => ({ showToast, showSuccess, showError }), [showToast, showSuccess, showError]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- React 19 Provider/Component type compatibility
  const Ctx = ToastContext.Provider as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- React 19 Component return type compatibility
  const ToastComp = Toast as any;
  return (
    <Ctx value={value}>
      {children}
      {toast && (
        <ToastComp
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      )}
    </Ctx>
  ) as React.ReactElement;
}
