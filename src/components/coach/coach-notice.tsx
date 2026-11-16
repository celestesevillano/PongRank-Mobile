import { Camera, CameraOff, CloudOff, RefreshCw, Settings, type LucideIcon } from 'lucide-react-native';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { Brand, Spacing } from '@/constants/theme';
import type { CameraAccess } from '@/hooks/use-camera-access';
import type { PoseEngineError } from '@/types/pose';

export type CoachNoticeReason = Exclude<CameraAccess, 'granted' | 'checking'> | PoseEngineError;

const NOTICES: Record<CoachNoticeReason, { Icon: LucideIcon; title: string; message: string }> = {
  prompt: {
    Icon: Camera,
    title: 'Coach necesita tu cámara',
    message: 'Analizamos tu postura y tus golpes en el teléfono. El video no se guarda ni se envía a ningún servidor.',
  },
  blocked: {
    Icon: CameraOff,
    title: 'Cámara desactivada',
    message: 'Bloqueaste el permiso de cámara. Actívalo en los ajustes del teléfono para usar Coach.',
  },
  'camera-denied': {
    Icon: CameraOff,
    title: 'Cámara desactivada',
    message: 'No pudimos abrir la cámara. Revisa el permiso en los ajustes del teléfono.',
  },
  'camera-unavailable': {
    Icon: CameraOff,
    title: 'Cámara ocupada',
    message: 'Otra app está usando la cámara o el teléfono no la encuentra. Ciérrala e intenta de nuevo.',
  },
  unsupported: {
    Icon: CameraOff,
    title: 'Tu teléfono no es compatible',
    message: 'El navegador interno no permite usar la cámara. Actualiza Android System WebView o tu sistema e intenta de nuevo.',
  },
  offline: {
    Icon: CloudOff,
    title: 'Sin conexión',
    message: 'La primera vez Coach descarga el modelo de MediaPipe (unos 5 MB). Conéctate a internet e intenta de nuevo.',
  },
  'model-failed': {
    Icon: CloudOff,
    title: 'No pudimos cargar MediaPipe',
    message: 'El modelo de análisis no respondió. Intenta de nuevo en unos segundos.',
  },
  timeout: {
    Icon: CloudOff,
    title: 'Está tardando demasiado',
    message: 'La conexión es lenta para descargar el modelo. Intenta con otra red o de nuevo en un momento.',
  },
  crashed: {
    Icon: RefreshCw,
    title: 'Coach se detuvo',
    message: 'El análisis se cerró de forma inesperada. Vuelve a iniciarlo.',
  },
};

const NEEDS_SETTINGS: CoachNoticeReason[] = ['blocked', 'camera-denied'];

export function CoachNotice({ reason, onRetry }: { reason: CoachNoticeReason; onRetry: () => void }) {
  const { Icon, title, message } = NOTICES[reason];
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.icon}>
        <Icon color={Brand.cyan} size={28} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        {NEEDS_SETTINGS.includes(reason) ? (
          <AuthButton label="Abrir ajustes" icon={Settings} onPress={() => Linking.openSettings()} />
        ) : (
          <AuthButton label={reason === 'prompt' ? 'Permitir cámara' : 'Reintentar'} icon={reason === 'prompt' ? Camera : RefreshCw} onPress={onRetry} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border, alignItems: 'center', justifyContent: 'center' },
  title: { color: Brand.text, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  message: { color: Brand.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 21 },
  actions: { alignSelf: 'stretch', marginTop: Spacing.two },
});
