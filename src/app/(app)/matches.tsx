import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenState } from '@/components/common/screen-state';
import { MatchCard } from '@/components/matches/match-card';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { usePaginated } from '@/hooks/use-paginated';
import { matchesService } from '@/services/matches.service';

type Tab = 'active' | 'history';

export default function MatchesScreen() {
  const { player } = useSession();
  const playerId = player?.id ?? 0;
  const [tab, setTab] = useState<Tab>('active');

  return (
    <ScreenContainer title="Mis partidas">
      <View style={styles.tabs}>
        <TabButton label="Activas" selected={tab === 'active'} onPress={() => setTab('active')} />
        <TabButton label="Historial" selected={tab === 'history'} onPress={() => setTab('history')} />
      </View>
      {tab === 'active' ? <ActiveMatches playerId={playerId} /> : <MatchHistory playerId={playerId} />}
    </ScreenContainer>
  );
}

function ActiveMatches({ playerId }: { playerId: number }) {
  const { data, loading, error, refetch } = useFetch((signal) => matchesService.active(playerId, signal), [playerId]);

  return (
    <View style={styles.list}>
      <ScreenState loading={loading} error={error} empty={data?.length === 0} emptyMessage="No tienes partidas activas." onRetry={refetch} />
      {data?.map((match) => <MatchCard key={match.id} match={match} playerId={playerId} />)}
      {data && <Text style={styles.hint}>Solo puedes tener una partida activa a la vez.</Text>}
    </View>
  );
}

function MatchHistory({ playerId }: { playerId: number }) {
  const matches = usePaginated((params, signal) => matchesService.byPlayer(playerId, { ...params, status: 'CONFIRMED' }, signal), [playerId]);

  return (
    <>
      <ScreenState
        loading={matches.loading}
        error={matches.error}
        empty={matches.data?.content.length === 0}
        emptyMessage="Aún no tienes partidas jugadas."
        onRetry={matches.refetch}
      />
      {matches.data && !matches.loading && (
        <FlatList
          data={matches.data.content}
          keyExtractor={(item) => String(item.id)}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
          ListFooterComponent={<PaginationBar page={matches.data} onPageChange={matches.setPage} />}
          renderItem={({ item }) => <MatchCard match={item} playerId={playerId} />}
        />
      )}
    </>
  );
}

function TabButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, selected && styles.tabSelected]}>
      <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Brand.border, marginBottom: Spacing.three },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabSelected: { borderBottomColor: Brand.red },
  tabLabel: { color: Brand.textSecondary, fontWeight: '600' },
  tabLabelSelected: { color: Brand.red },
  list: { gap: Spacing.two },
  hint: { color: Brand.textSecondary, fontSize: 12, textAlign: 'center', marginTop: Spacing.three },
});
