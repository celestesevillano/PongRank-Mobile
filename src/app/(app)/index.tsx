import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenState } from '@/components/common/screen-state';
import { MatchCard } from '@/components/matches/match-card';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { communitiesService } from '@/services/communities.service';
import { matchesService } from '@/services/matches.service';

const TOP_SIZE = 5;
const POSITION_LOOKUP_SIZE = 100;

export default function DashboardScreen() {
  const { player } = useSession();
  const playerId = player?.id ?? 0;

  const standing = useFetch(async (signal) => {
    const [community] = await communitiesService.mine(signal);
    if (!community) return null;
    const page = await communitiesService.ranking(community.id, { page: 0, size: POSITION_LOOKUP_SIZE }, signal);
    return {
      communityName: community.name,
      top: page.content.slice(0, TOP_SIZE),
      position: page.content.find((entry) => entry.playerId === playerId)?.position ?? null,
    };
  }, [playerId]);

  const recent = useFetch((signal) => matchesService.byPlayer(playerId, { page: 0, size: 3 }, signal), [playerId]);

  return (
    <ScreenContainer title={`Hola, ${player?.name?.split(' ')[0] ?? 'jugador'}`}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.ratingCard}>
          <View>
            <Text style={styles.label}>Tu rating</Text>
            <Text style={styles.rating}>{Math.round(player?.ratingGlicko ?? 1500)}</Text>
          </View>
          {standing.data?.position && (
            <View style={styles.position}>
              <Text style={styles.label}>Puesto</Text>
              <Text style={styles.positionValue}>
                #{standing.data.position} en {standing.data.communityName}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.section}>Ranking {standing.data ? standing.data.communityName : ''}</Text>
        <ScreenState
          loading={standing.loading}
          error={standing.error}
          empty={standing.data === null}
          emptyMessage="Únete a una comunidad para ver su ranking."
          onRetry={standing.refetch}
        />
        {standing.data?.top.map((entry) => (
          <View key={entry.playerId} style={styles.rankRow}>
            <Text style={styles.rankPosition}>{entry.position}</Text>
            <Text style={styles.rankName}>{entry.playerName}</Text>
            <Text style={styles.rankRating}>{Math.round(entry.ratingGlicko)}</Text>
          </View>
        ))}

        <Text style={styles.section}>Tu actividad</Text>
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
  ratingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Brand.surface,
    borderRadius: Spacing.three,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Brand.red,
  },
  label: { color: Brand.textSecondary, fontSize: 13 },
  rating: { color: Brand.red, fontSize: 52, fontWeight: '800' },
  position: { alignItems: 'flex-end', maxWidth: '50%' },
  positionValue: { color: Brand.text, fontWeight: '700', textAlign: 'right' },
  section: { color: Brand.text, fontSize: 18, fontWeight: '700', marginTop: Spacing.three },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderBottomWidth: 1, borderBottomColor: Brand.border, paddingVertical: Spacing.two },
  rankPosition: { color: Brand.textSecondary, width: 24, fontWeight: '700' },
  rankName: { color: Brand.text, flex: 1, fontWeight: '600' },
  rankRating: { color: Brand.textSecondary, fontWeight: '700' },
});
