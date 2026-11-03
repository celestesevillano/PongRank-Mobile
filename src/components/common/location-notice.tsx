import { Linking, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { Brand, Spacing } from '@/constants/theme';
import type { LocationStatus } from '@/hooks/use-location';

const MESSAGES: Record<Exclude<LocationStatus, 'ready'>, string> = {
  loading: 'Buscando tu ubicación…',
  denied: 'Necesitamos tu ubicación para encontrar partidas cerca de ti. Actívala en los ajustes del teléfono.',
  unavailable: 'No pudimos obtener tu ubicación. Revisa que el GPS esté encendido.',
};

export function LocationNotice({ status, onRetry }: { status: Exclude<LocationStatus, 'ready'>; onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{MESSAGES[status]}</Text>
      {status === 'denied' && <AuthButton label="Abrir ajustes" variant="ghost" onPress={() => Linking.openSettings()} />}
      {status !== 'loading' && <AuthButton label="Reintentar" onPress={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two, padding: Spacing.four, alignItems: 'stretch' },
  message: { color: Brand.textSecondary, textAlign: 'center' },
});
