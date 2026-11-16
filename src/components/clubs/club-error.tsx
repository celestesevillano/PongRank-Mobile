import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { pongiArt } from '@/components/pongmigos/pongmigos-ui';
import { Brand, Spacing } from '@/constants/theme';
import type { ApiError } from '@/utils/api-error';

export function ClubError({ error, fallback, onRetry }: { error: ApiError; fallback: string; onRetry: () => void }) {
  const offline = error.isNetwork;
  const unavailable = !offline && (error.status ?? 0) >= 500;
  return <View style={styles.state}>
    <Image source={offline ? pongiArt.offline : require('../../../assets/images/club-error-servicio.webp')}
      style={styles.art} contentFit="contain" accessible={false} />
    <Text accessibilityRole="header" style={styles.title}>
      {offline ? 'Problema de conexión' : unavailable ? 'Problema de servicio' : fallback}
    </Text>
    {(offline || unavailable) && <Text style={styles.message}>
      {offline ? 'No pudimos conectar con PongRank. Revisa tu conexión.' : 'PongRank no está disponible en este momento. Inténtalo de nuevo más tarde.'}
    </Text>}
    <AuthButton label="Reintentar" hideChevron onPress={onRetry} style={styles.button} />
  </View>;
}

const styles = StyleSheet.create({
  state: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.two },
  art: { width: 144, height: 144 },
  title: { color: Brand.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  message: { color: Brand.textSecondary, textAlign: 'center' },
  button: { alignSelf: 'stretch' },
});
