import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Spacing } from '@/constants/theme';

type ToastKind = 'success' | 'error';
type ToastContextValue = { showToast: (message: string, kind?: ToastKind) => void };

const TOAST_DURATION_MS = 3000;

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, kind });
    timer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <View pointerEvents="none" style={[styles.container, { top: insets.top + Spacing.two }]}>
          <View style={[styles.toast, toast.kind === 'error' ? styles.error : styles.success]}>
            <Text style={styles.text}>{toast.message}</Text>
          </View>
        </View>
      )}
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

const styles = StyleSheet.create({
  container: { position: 'absolute', left: Spacing.three, right: Spacing.three, alignItems: 'center' },
  toast: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: Spacing.three, borderWidth: 1 },
  success: { backgroundColor: '#0E2A22', borderColor: '#2BB673' },
  error: { backgroundColor: '#2A0E10', borderColor: Brand.red },
  text: { color: Brand.text, fontWeight: '600' },
});
