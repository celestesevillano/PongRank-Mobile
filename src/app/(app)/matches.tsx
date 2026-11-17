import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { AuthButton } from '@/components/auth/auth-button';
import { ActionRow } from '@/components/common/action-row';
import { PillTabs } from '@/components/common/pill-tabs';
import { matchArt, MatchBanner, MatchState } from '@/components/matches/match-ui';

import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenState } from '@/components/common/screen-state';
import { MatchCard } from '@/components/matches/match-card';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { usePaginated } from '@/hooks/use-paginated';
import { matchesService } from '@/services/matches.service';

type Tab = 'active' | 'history' | 'tournaments';

export default function MatchesScreen() {
  const { player } = useSession();
  const playerId = player?.id ?? 0;
  const { section } = useLocalSearchParams<{ section?: string }>();
  const [tab, setTab] = useState<Tab>(section === 'history' ? 'history' : 'active');
  useFocusEffect(useCallback(() => { if (section === 'history') setTab('history'); }, [section]));

  return (
    <ScreenContainer>
      <MatchBanner title="Partidas"><Text style={styles.hint}>Tu actividad en la mesa</Text></MatchBanner>
      <PillTabs variant="segment" options={[{ key: 'active', label: 'Activas' }, { key: 'history', label: 'Historial' }, { key: 'tournaments', label: 'Torneos' }]} selected={tab} onSelect={setTab} />
      {tab === 'active' && <ActiveMatches playerId={playerId} />}
      {tab === 'history' && <MatchHistory playerId={playerId} />}
      {tab === 'tournaments' && <TournamentMatches playerId={playerId} />}
    </ScreenContainer>
  );
}

function ActiveMatches({ playerId }: { playerId: number }) {
  const { data, loading, error, refetch } = useFetch((signal) => matchesService.active(playerId, signal), [playerId]);
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  return <>
    {loading || error
      ? <View style={styles.center}><ScreenState loading={loading} error={error} onRetry={refetch} /></View>
      : data?.length
        ? <FlatList style={styles.list} data={data} keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.cards} renderItem={({ item }) => <MatchCard match={item} playerId={playerId} />} />
        : <View style={styles.center}><MatchState title="Sin partidas activas" message="Crea una partida o busca una abierta." art={matchArt.idle} /></View>}
    <View style={styles.footer}><ActionRow>
      <AuthButton label="Nueva partida" icon={Plus} onPress={() => router.push('/new-match')} />
      <AuthButton label="Buscar partida" icon={Search} variant="secondary" onPress={() => router.push('/find-match')} />
    </ActionRow></View>
  </>;
}

function MatchHistory({ playerId }: { playerId: number }) {
  const matches = usePaginated((params, signal) => matchesService.byPlayer(playerId, { ...params, status: 'CONFIRMED' }, signal), [playerId]);

  useFocusEffect(useCallback(() => { matches.refetch(); }, [matches.refetch]));
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

function TournamentMatches({ playerId }: { playerId: number }) {
  const { data, loading, error, refetch } = useFetch((signal) => matchesService.forTournaments(playerId, signal), [playerId]);
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));
  if (loading || error) return <ScreenState loading={loading} error={error} onRetry={refetch} />;
  if (!data?.length) return <View style={styles.center}><MatchState title="Sin partidas de torneo" message="Consulta los torneos desde tu club." art={matchArt.tournaments} /></View>;
  return <FlatList style={styles.list} data={data} keyExtractor={(item) => String(item.id)}
    contentContainerStyle={styles.cards} renderItem={({ item }) => <MatchCard match={item} playerId={playerId} />} />;
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  cards: { gap: Spacing.two, paddingBottom: Spacing.two },
  footer: { paddingVertical: Spacing.three },
  center: { flex: 1, justifyContent: 'center' },
  hint: { color: Brand.textSecondary, fontSize: 13 },
});
