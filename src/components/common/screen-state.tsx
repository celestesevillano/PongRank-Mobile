import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { Brand, Spacing } from '@/constants/theme';
import type { ApiError } from '@/utils/api-error';

type ScreenStateProps = {
  loading: boolean;
  error: ApiError | null;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
};

export function ScreenState({ loading, error, empty, emptyMessage = 'Aún no hay nada por aquí.', onRetry }: ScreenStateProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={Brand.red} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{error.isNetwork ? 'Sin conexión' : 'No pudimos cargar esto'}</Text>
        <Text style={styles.message}>{error.message}</Text>
        {onRetry && <AuthButton label="Reintentar" onPress={onRetry} style={styles.button} />}
      </View>
    );
  }

  if (empty) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{emptyMessage}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.five },
  title: { color: Brand.text, fontSize: 18, fontWeight: '700' },
  message: { color: Brand.textSecondary, textAlign: 'center', fontSize: 14 },
  button: { alignSelf: 'stretch', marginTop: Spacing.two, paddingHorizontal: Spacing.five },
});
