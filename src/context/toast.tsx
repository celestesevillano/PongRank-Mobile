import { CircleAlert, CircleCheck } from 'lucide-react-native';
import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { ConfirmDialog } from '@/components/common/confirm-dialog';

type ToastKind = 'success' | 'error';
type ToastContextValue = { showToast: (message: string, kind?: ToastKind) => void };

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Los avisos de la app se muestran como popup (icono, título, texto y «Aceptar»), no como toast.
// Se mantiene el nombre `showToast` para no tocar las pantallas que ya lo usan.
export function ToastProvider({ children }: PropsWithChildren) {
  const [notice, setNotice] = useState<{ message: string; kind: ToastKind } | null>(null);

  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    setNotice({ message, kind });
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);
  const close = () => setNotice(null);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ConfirmDialog busy={false} onCancel={close} confirmation={notice ? {
        title: notice.kind === 'error' ? 'No se pudo completar' : 'Listo',
        message: notice.message,
        label: 'Aceptar',
        Icon: notice.kind === 'error' ? CircleAlert : CircleCheck,
        destructive: notice.kind === 'error',
        success: notice.kind === 'success',
        infoOnly: true,
        onConfirm: close,
      } : null} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return ctx;
}
