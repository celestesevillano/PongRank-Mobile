import { LockKeyhole, Users } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ScreenState } from '@/components/common/screen-state';
import { ProfileScreen } from '@/components/profile/profile-screen';
import { Brand, Spacing } from '@/constants/theme';
import { useFetch } from '@/hooks/use-fetch';
import { friendshipsService, type PongmigosVisibility } from '@/services/friendships.service';

export default function PrivacyRoute() {
  const { data, loading, error, refetch } = useFetch(friendshipsService.getVisibility);
  const [updated, setUpdated] = useState<PongmigosVisibility>();
  const [saving, setSaving] = useState<PongmigosVisibility>();
  const [message, setMessage] = useState('');
  const current = updated ?? data?.visibility;

  const update = async (choice: PongmigosVisibility) => {
    if (choice === current || saving) return;
    setSaving(choice);
    setMessage('');
    try {
      const response = await friendshipsService.updateVisibility(choice);
      setUpdated(response.visibility);
    } catch {
      setMessage('No pudimos guardar la visibilidad. Intenta de nuevo.');
    } finally {
      setSaving(undefined);
    }
  };
  return (
    <ProfileScreen title="Privacidad" back={{ label: 'Configuración', route: '/profile/settings' }}>
      <ScreenState loading={loading} error={error} onRetry={refetch} />
      {current ? (
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>Visibilidad de la lista de Pongmigos</Text>
          <Text style={styles.text}>{current === 'ONLY_ME' ? 'Solo tú puedes ver los nombres de tu lista.' : 'Otros jugadores pueden abrir tu lista desde tu perfil.'}</Text>
          <AuthButton label="Todos" icon={Users} variant={current === 'EVERYONE' ? 'primary' : 'secondary'} loading={saving === 'EVERYONE'} disabled={Boolean(saving)} accessibilityState={{ selected: current === 'EVERYONE' }} onPress={() => update('EVERYONE')} />
          <AuthButton label="Solo yo" icon={LockKeyhole} variant={current === 'ONLY_ME' ? 'primary' : 'secondary'} loading={saving === 'ONLY_ME'} disabled={Boolean(saving)} accessibilityState={{ selected: current === 'ONLY_ME' }} onPress={() => update('ONLY_ME')} />
          {message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}
        </View>
      ) : null}
    </ProfileScreen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 14, padding: Spacing.three, gap: Spacing.two },
  title: { color: Brand.text, fontSize: 17, fontWeight: '700' },
  text: { color: Brand.textSecondary, fontSize: 14, lineHeight: 20 },
  error: { color: '#FFB3B8', fontSize: 13 },
});
