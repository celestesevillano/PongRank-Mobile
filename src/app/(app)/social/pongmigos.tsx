import { router } from 'expo-router';

import { CommunityScreen } from '@/components/communities/community-screen';
import { PongmigosList } from '@/components/pongmigos/pongmigos-list';

export default function PongmigosScreen() {
  return (
    <CommunityScreen title="Mis Pongmigos" onBack={() => router.canGoBack() ? router.back() : router.replace('/social')}>
      <PongmigosList />
    </CommunityScreen>
  );
}
