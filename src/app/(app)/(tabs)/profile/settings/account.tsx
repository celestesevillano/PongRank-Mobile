import { router } from 'expo-router';
import { Layers, LogOut } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ProfileRow, ProfileScreen } from '@/components/profile/profile-screen';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import type { PlayerResponse } from '@/types/api';

const GENDER_LABEL: Record<string, string> = { FEMALE: 'Femenino', MALE: 'Masculino', PREFER_NOT_TO_SAY: 'Prefiero no decirlo' };

function formatBirthDate(value?: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function accountFields(player: PlayerResponse): { label: string; value: string }[] {
  const rows: { label: string; value: string | null | undefined }[] = [
    { label: 'Nombre', value: player.name },
    { label: 'Usuario', value: player.username ? `@${player.username.replace(/^@/, '')}` : null },
    { label: 'Correo', value: player.email },
    { label: 'WhatsApp', value: player.whatsapp },
    { label: 'Fecha de nacimiento', value: formatBirthDate(player.birthDate) },
    { label: 'Género', value: player.gender ? GENDER_LABEL[player.gender] ?? player.gender : null },
    { label: 'Categoría FDPTM', value: player.categoryFdptm },
  ];
  return rows.filter((row): row is { label: string; value: string } => Boolean(row.value));
}

export default function AccountRoute() {
  const { player, signOut } = useSession();
  const { showToast } = useToast();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const logOut = async () => {
    setBusy(true);
    try {
      await signOut();
    } catch {
      showToast('No pudimos cerrar tu sesión. Intenta de nuevo.', 'error');
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };
  return (
    <ProfileScreen
      title="Cuenta"
      back={{ label: 'Configuración', route: '/profile/settings' }}
      footer={<AuthButton label="Cerrar sesión" icon={LogOut} onPress={() => setConfirm(true)} />}>
      <View style={styles.card} accessibilityLabel="Datos de tu cuenta">
        {player ? accountFields(player).map(({ label, value }, index) => (
          <View key={label} style={[styles.field, index > 0 && styles.divider]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value} selectable>{value}</Text>
          </View>
        )) : null}
      </View>
      <ProfileRow Icon={Layers} label="Mi plan" onPress={() => router.push('/profile/plan')} />
      <ConfirmDialog busy={busy} onCancel={() => setConfirm(false)} confirmation={confirm ? {
        title: 'Cerrar sesión', message: '¿Seguro que quieres salir?', label: 'Cerrar sesión',
        Icon: LogOut, destructive: true, onConfirm: logOut,
      } : null} />
    </ProfileScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface, paddingHorizontal: Spacing.three },
  field: { paddingVertical: 12, gap: 2 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Brand.border },
  label: { color: Brand.textSecondary, fontSize: 13 },
  value: { color: Brand.text, fontSize: 16, fontWeight: '600' },
});
