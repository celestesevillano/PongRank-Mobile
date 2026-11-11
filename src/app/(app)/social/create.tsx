import { router } from 'expo-router';

import { CommunityForm } from '@/components/communities/community-form';
import { CommunityScreen } from '@/components/communities/community-screen';

export default function CreateSocialCommunityScreen() {
  return (
    <CommunityScreen title="Crear comunidad" onBack={() => router.dismissTo('/social')}>
      <CommunityForm onCreated={() => router.dismissTo('/social')} />
    </CommunityScreen>
  );
}
