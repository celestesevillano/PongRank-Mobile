import { router } from 'expo-router';

import { CommunityForm } from '@/components/communities/community-form';
import { CommunityScreen } from '@/components/communities/community-screen';
import { useSession } from '@/context/session';

export default function CreateCommunityScreen() {
  const { completeOnboarding } = useSession();

  return (
    <CommunityScreen title="Crear comunidad" onBack={() => router.back()}>
      <CommunityForm onCreated={completeOnboarding} />
    </CommunityScreen>
  );
}
