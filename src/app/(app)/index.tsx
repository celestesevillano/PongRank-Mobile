import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenState } from '@/components/common/screen-state';
import { MatchCard } from '@/components/matches/match-card';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { communitiesService } from '@/services/communities.service';
import { matchesService } from '@/services/matches.service';

export default function DashboardScreen() {
  const { player } = useSession();
  const playerId = player?.id ?? 0;

  const communities = useFetch((signal) => communitiesService.mine(signal), []);
  const recent = useFetch((signal) => matchesService.byPlayer(playerId, { page: 0, size: 3 }, signal), [playerId]);

  return (
    <ScreenContainer title={`Hola, ${player?.name?.split(' ')[0] ?? 'jugador'}`}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.ratingCard}>
          <Text style={styles.label}>Tu rating</Text>
          <Text style={styles.rating}>{Math.round(player?.ratingGlicko ?? 1500)}</Text>
        </View>

        <Text style={styles.section}>Tus comunidades</Text>
        <ScreenState
          loading={communities.loading}
          error={communities.error}
          empty={communities.data?.length === 0}
          emptyMessage="Todavía no te unes a ninguna comunidad."
          onRetry={communities.refetch}
        />
        {communities.data?.map((community) => (
          <View key={community.id} style={styles.communityRow}>
            <Text style={styles.communityName}>{community.name}</Text>
            <Text style={styles.label}>{community.memberCount} miembros</Text>
          </View>
        ))}

        <Text style={styles.section}>Últimas partidas</Text>
        <ScreenState
          loading={recent.loading}
          error={recent.error}
          empty={recent.data?.content.length === 0}
          emptyMessage="Aún no juegas partidas."
          onRetry={recent.refetch}
        />
        {recent.data?.content.map((match) => <MatchCard key={match.id} match={match} playerId={playerId} />)}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.two, paddingBottom: Spacing.five },
  ratingCard: { alignItems: 'center', backgroundColor: Brand.surface, borderRadius: Spacing.three, padding: Spacing.four, borderWidth: 1, borderColor: Brand.border },
  label: { color: Brand.textSecondary, fontSize: 13 },
  rating: { color: Brand.red, fontSize: 52, fontWeight: '800' },
  section: { color: Brand.text, fontSize: 18, fontWeight: '700', marginTop: Spacing.three },
  communityRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Brand.surface, borderRadius: Spacing.three, padding: Spacing.three },
  communityName: { color: Brand.text, fontWeight: '600' },
});
