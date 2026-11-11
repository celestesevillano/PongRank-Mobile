import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { RankingPosition } from '@/components/communities/ranking-position';
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

  return (
    <ScreenContainer title="Ranking">
      <ScreenState
        loading={communities.loading}
        error={communities.error}
        empty={noCommunities}
        emptyMessage="Únete a una comunidad para ver su ranking."
        onRetry={communities.refetch}
      />

      {noCommunities && <AuthButton label="Explorar comunidades" icon={Search} onPress={() => router.navigate('/social/explore')} />}

      {communityId !== null && (
        <>
          <FlatList
            horizontal
            data={communities.data ?? []}
            keyExtractor={(item) => String(item.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            style={styles.chipList}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setSelectedId(item.id);
                  if (requested) router.setParams({ communityId: String(item.id) });
                  ranking.setPage(0);
                }}
                style={[styles.chip, item.id === communityId && styles.chipActive]}>
                <Text style={styles.chipLabel}>{item.name}</Text>
              </Pressable>
            )}
          />

          <ScreenState loading={ranking.loading} error={ranking.error} empty={ranking.data?.content.length === 0} onRetry={ranking.refetch} />

          {ranking.data && !ranking.loading && (
            <FlatList
              data={ranking.data.content}
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
  chipList: { flexGrow: 0, marginBottom: Spacing.three },
  chips: { gap: Spacing.two },
  chip: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: 999, backgroundColor: Brand.surface },
  chipActive: { backgroundColor: Brand.red },
  chipLabel: { color: Brand.text, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, backgroundColor: Brand.surface, borderRadius: Spacing.three, padding: Spacing.three },
  rowMe: { borderWidth: 1, borderColor: Brand.red },
  name: { color: Brand.text, flex: 1, fontWeight: '600' },
  rating: { color: Brand.red, fontWeight: '800' },
});
