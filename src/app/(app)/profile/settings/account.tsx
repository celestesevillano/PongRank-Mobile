import { router } from 'expo-router';
import { Layers, LogOut, Pencil } from 'lucide-react-native';
import { useState } from 'react';

import { AuthButton } from '@/components/auth/auth-button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ProfileRow, ProfileScreen } from '@/components/profile/profile-screen';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';

export default function AccountRoute() {
  const { signOut } = useSession();
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
    <ProfileScreen title="Cuenta" back={{ label: 'Configuración', route: '/profile/settings' }}>
      <ProfileRow Icon={Pencil} label="Editar perfil" onPress={() => router.push('/profile/edit')} />
      <ProfileRow Icon={Layers} label="Mi plan" onPress={() => router.push('/profile/plan')} />
      <AuthButton label="Cerrar sesión" variant="text" icon={LogOut} onPress={() => setConfirm(true)} />
      <ConfirmDialog busy={busy} onCancel={() => setConfirm(false)} confirmation={confirm ? {
        title: 'Cerrar sesión', message: '¿Seguro que quieres salir?', label: 'Cerrar sesión',
        Icon: LogOut, onConfirm: logOut,
      } : null} />
    </ProfileScreen>
  );
}
