import { router } from 'expo-router';
import { ScrollView } from 'react-native';

import { CommunityForm } from '@/components/communities/community-form';
import { CommunityScreen } from '@/components/communities/community-screen';

export default function CreateSocialCommunityScreen() {
  return (
    <CommunityScreen title="Crear comunidad" onBack={() => router.dismissTo('/social')}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <CommunityForm onCreated={() => router.dismissTo('/social')} />
      </ScrollView>
    </CommunityScreen>
  );
}
