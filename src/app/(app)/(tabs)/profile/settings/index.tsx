import { router } from 'expo-router';
import { ShieldCheck, UserRound } from 'lucide-react-native';

import { ProfileRow, ProfileScreen } from '@/components/profile/profile-screen';

export default function SettingsRoute() {
  return (
    <ProfileScreen title="Configuración" back={{ label: 'Perfil', route: '/profile' }}>
      <ProfileRow Icon={UserRound} label="Cuenta" detail="Perfil y plan" onPress={() => router.push('/profile/settings/account')} />
      <ProfileRow Icon={ShieldCheck} label="Privacidad" detail="Quién puede ver tu información" onPress={() => router.push('/profile/settings/privacy')} />
    </ProfileScreen>
  );
}
