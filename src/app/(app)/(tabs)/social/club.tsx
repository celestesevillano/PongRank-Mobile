import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { ClubCard } from '@/components/clubs/club-card';
import { CommunityScreen } from '@/components/communities/community-screen';
import { ScreenState } from '@/components/common/screen-state';
import { Brand, Spacing } from '@/constants/theme';
import { useFetch } from '@/hooks/use-fetch';
import { clubsService } from '@/services/clubs.service';

export default function ClubDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const club = useFetch((signal) => clubsService.detail(Number(id), signal), [id]);

  return (
    <CommunityScreen title="Club" onBack={() => router.canGoBack() ? router.back() : router.replace('/social')}>
      <ScreenState loading={club.loading} error={club.error} onRetry={club.refetch} />
      {!club.loading && !club.error && club.data && (
        <ScrollView contentContainerStyle={styles.content}>
          <ClubCard name={club.data.name} description={club.data.address} featured />
          {club.data.status === 'PENDING' && <Text style={styles.status}>Registro en revisión</Text>}
          {club.data.status === 'REJECTED' && <Text style={styles.status}>Registro rechazado</Text>}
        </ScrollView>
      )}
    </CommunityScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three },
  status: { color: Brand.textSecondary, fontSize: 16 },
});
