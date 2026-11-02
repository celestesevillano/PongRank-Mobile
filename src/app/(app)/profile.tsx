import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ScreenContainer } from '@/components/common/screen-container';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';

export default function ProfileScreen() {
  const { player, signOut } = useSession();

  const confirmSignOut = () =>
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => signOut() },
    ]);

  return (
    <ScreenContainer title="Perfil">
      <View style={styles.card}>
        <Text style={styles.name}>{player?.name}</Text>
        <Text style={styles.meta}>{player?.email}</Text>
        <Text style={styles.meta}>
          Rating {Math.round(player?.ratingGlicko ?? 1500)}
          {player?.federatedDeclared && player.categoryFdptm ? ` · FDPTM ${player.categoryFdptm}` : ''}
        </Text>
      </View>
      <AuthButton label="Cerrar sesión" variant="ghost" onPress={confirmSignOut} style={styles.signOut} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Brand.surface, borderRadius: Spacing.three, padding: Spacing.four, gap: Spacing.one, borderWidth: 1, borderColor: Brand.border },
  name: { color: Brand.text, fontSize: 22, fontWeight: '800' },
  meta: { color: Brand.textSecondary, fontSize: 14 },
  signOut: { marginTop: Spacing.four },
});
