import { router } from 'expo-router';
import { ScrollView } from 'react-native';

import { CommunityForm } from '@/components/communities/community-form';
import { CommunityScreen } from '@/components/communities/community-screen';
import { useSession } from '@/context/session';

export default function CreateCommunityScreen() {
  const { completeOnboarding } = useSession();

  return (
    <CommunityScreen title="Crear comunidad" onBack={() => router.back()}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <CommunityForm onCreated={completeOnboarding} />
      </ScrollView>
    </CommunityScreen>
  );
}
