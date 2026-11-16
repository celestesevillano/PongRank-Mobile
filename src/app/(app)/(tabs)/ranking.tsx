import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Search, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { getRankingMedal, RankingPosition } from '@/components/communities/ranking-position';
import { PillTabs } from '@/components/common/pill-tabs';
import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenState } from '@/components/common/screen-state';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { usePaginated } from '@/hooks/use-paginated';
import { communitiesService } from '@/services/communities.service';

export default function RankingScreen() {
  const { player } = useSession();
  const { communityId: requested } = useLocalSearchParams<{ communityId?: string }>();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const communities = useFetch((signal) => communitiesService.mine(signal), []);
  useFocusEffect(communities.refetch);
  const requestedId = Number(requested);
  const preferred = requested ? requestedId : selectedId;
  const communityId = communities.data?.find((community) => community.id === preferred)?.id ?? communities.data?.[0]?.id ?? null;

  const ranking = usePaginated(
    (params, signal) => (communityId ? communitiesService.ranking(communityId, params, signal) : Promise.reject(new Error('no community'))),
    [communityId],
    20,
  );

  const noCommunities = !communities.loading && communities.data?.length === 0;
  const entries = ranking.data?.content ?? [];
  const podium = entries.filter(({ position }) => position >= 1 && position <= 3);
  const otherPositions = entries.filter(({ position }) => position > 3);


  return (
    <ScreenContainer title="Ranking">
      <ScreenState
        loading={communities.loading}
        error={communities.error}
        empty={noCommunities}
        emptyMessage="Únete a una comunidad para ver su ranking."
        onRetry={communities.refetch}
      />

      {noCommunities && <AuthButton label="Explorar comunidades" icon={Search} onPress={() => router.navigate({ pathname: '/social/explore', params: { filter: 'communities' } })} />}

      {communityId !== null && (
        <>
          <PillTabs
            variant="chip"
            options={(communities.data ?? []).map(({ id, name }) => ({ key: String(id), label: name }))}
            selected={String(communityId)}
            onSelect={(key) => {
              setSelectedId(Number(key));
              if (requested) router.setParams({ communityId: key });
              ranking.setPage(0);
            }}
          />

          <ScreenState loading={ranking.loading} error={ranking.error} empty={ranking.data?.content.length === 0} onRetry={ranking.refetch} />

          {ranking.data && !ranking.loading && !ranking.error && (
            <FlatList
              data={otherPositions}
              contentContainerStyle={styles.list}
              ListHeaderComponent={
                <>
                  {entries.length > 0 && (
                    <View style={styles.positionsHeader}>
                      <Text accessibilityRole="header" style={styles.positionsTitle}>Posiciones</Text>
                      <Text style={styles.ratingLabel}>Rating PongRank</Text>
                    </View>
                  )}
                  {podium.length > 0 && (
                    <View style={styles.podium}>
                      <View style={styles.podiumHeader}>
                        <Trophy size={20} color="#FFD278" />
                        <Text accessibilityRole="header" style={styles.podiumTitle}>Top 3 de la comunidad</Text>
                      </View>
                      {podium.map((item) => {
                        const medal = getRankingMedal(item.position);
                        return (
                          <View key={item.playerId} style={[styles.podiumRow, { backgroundColor: medal.backgroundColor + '60' }]}>
                            <RankingPosition position={item.position} />
                            <Text style={styles.name}>{item.playerName}{item.playerId === player?.id ? ' (tú)' : ''}</Text>
                            <Text style={[styles.rating, styles.podiumRating, { color: medal.color }]}>{Math.round(item.ratingGlicko)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </>
              }
              keyExtractor={(item) => String(item.playerId)}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
              ListFooterComponent={<PaginationBar page={ranking.data} onPageChange={ranking.setPage} />}
              renderItem={({ item }) => (
                <View style={[styles.row, item.playerId === player?.id && styles.rowMe]}>
                  <RankingPosition position={item.position} />
                  <Text style={styles.name}>{item.playerName}</Text>
                  <Text style={styles.rating}>{Math.round(item.ratingGlicko)}</Text>
                </View>
              )}
            />
          )}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: Spacing.three },
  podium: {
    marginVertical: Spacing.two, backgroundColor: Brand.surface, borderRadius: 16,
    borderWidth: 2, borderColor: '#FFD278A6', boxShadow: '0 0 14px #FFD27838',
  },
  podiumHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: 12,
    borderTopLeftRadius: 14, borderTopRightRadius: 14, backgroundColor: '#FFD27818',
  },
  podiumTitle: { flex: 1, color: Brand.text, fontSize: 18, fontWeight: '800' },
  podiumRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 48,
    paddingVertical: Spacing.two, paddingHorizontal: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Brand.border,
  },
  podiumRating: { fontSize: 18 },
  positionsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginVertical: Spacing.two },
  positionsTitle: { flex: 1, color: Brand.text, fontSize: 16, fontWeight: '700' },
  ratingLabel: { color: Brand.textSecondary, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, backgroundColor: Brand.surface, borderRadius: 14, padding: 12 },
  rowMe: { borderWidth: 1, borderColor: Brand.red },
  name: { color: Brand.text, flex: 1, fontWeight: '600' },
  rating: { color: '#22D3EE', fontVariant: ['tabular-nums'], fontWeight: '800' },
});
