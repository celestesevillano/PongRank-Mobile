import { router, useLocalSearchParams } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthInput } from '@/components/auth/auth-input';
import { ClubCard } from '@/components/clubs/club-card';
import { CommunityCard } from '@/components/communities/community-card';
import { CommunityScreen } from '@/components/communities/community-screen';
import { PaginationBar } from '@/components/common/pagination-bar';
import { PillTabs } from '@/components/common/pill-tabs';
import { ScreenState } from '@/components/common/screen-state';
import { PlayerResult, PongiState, pongiArt } from '@/components/pongmigos/pongmigos-ui';
import { Brand, Spacing } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePaginated } from '@/hooks/use-paginated';
import { clubsService } from '@/services/clubs.service';
import { communitiesService } from '@/services/communities.service';
import { playersService } from '@/services/players.service';
import type { Page, PageParams } from '@/types/api';

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'players', label: 'Jugadores' },
  { key: 'clubs', label: 'Clubes' },
  { key: 'communities', label: 'Comunidades' },
] as const;

const MIN_PLAYER_QUERY_LENGTH = 2;

type Filter = (typeof FILTERS)[number]['key'];

export default function SocialSearchScreen() {
  const { filter: initial } = useLocalSearchParams<{ filter?: string }>();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>(initial === 'communities' || initial === 'clubs' || initial === 'players' ? initial : 'all');
  const name = useDebouncedValue(query.trim(), 300);

  return (
    <CommunityScreen title="Buscar en Social" onBack={() => router.canGoBack() ? router.back() : router.replace('/social')}>
      <View style={styles.input}>
        <AuthInput icon={Search} accessibilityLabel="Buscar por nombre" placeholder="Buscar por nombre"
          value={query} onChangeText={setQuery} autoCorrect={false} returnKeyType="search" />
      </View>
      <PillTabs variant="chip" options={FILTERS} selected={filter} onSelect={setFilter} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.results}>
        {(filter === 'players' || filter === 'all') && name.length >= MIN_PLAYER_QUERY_LENGTH && (
          <Results key={`players:${name}`} title="Jugadores" empty="No encontramos a nadie con ese nombre." artwork={pongiArt.search}
            fetchPage={(params, signal) => playersService.search(name, params, signal)}
            renderItem={(player) => <PlayerResult player={player} />} />
        )}
        {filter === 'players' && name.length < MIN_PLAYER_QUERY_LENGTH && <Text style={styles.hint}>Escribe al menos dos caracteres del nombre o usuario.</Text>}
        {(filter === 'all' || filter === 'clubs') && (
          <Results key={`clubs:${name}`} title="Clubes" empty="No encontramos clubes con ese nombre."
            fetchPage={(params, signal) => clubsService.search({ ...params, name: name || undefined }, signal)}
            renderItem={(club) => <ClubCard name={club.name} description={club.address}
              onPress={() => router.push({ pathname: '/social/club', params: { id: club.id } })} />} />
        )}
        {(filter === 'all' || filter === 'communities') && (
          <Results key={`communities:${name}`} title="Comunidades" empty="No encontramos comunidades con ese nombre."
            fetchPage={(params, signal) => communitiesService.search({ ...params, name: name || undefined }, signal)}
            renderItem={(community) => <CommunityCard community={community}
              onPress={() => router.push({ pathname: '/social/[id]', params: { id: community.id } })} />} />
        )}
      </ScrollView>
    </CommunityScreen>
  );
}

function Results<T extends { id: number }>({ title, empty, artwork, fetchPage, renderItem }: {
  title: string;
  empty: string;
  artwork?: number;
  fetchPage: (params: PageParams, signal?: AbortSignal) => Promise<Page<T>>;
  renderItem: (item: T) => ReactNode;
}) {
  const result = usePaginated(fetchPage, [], 5);

  return (
    <View style={styles.section}>
      <Text style={styles.heading} accessibilityRole="header">{title}</Text>
      {artwork && result.error ? <PongiState error={result.error} retry={result.refetch} />
        : artwork && !result.loading && result.data?.content.length === 0 ? <PongiState artwork={artwork} text={empty} />
        : <ScreenState loading={result.loading} error={result.error} empty={result.data?.content.length === 0}
          emptyMessage={empty} onRetry={result.refetch} />}
      {!result.loading && !result.error && result.data?.content.map((item) => <View key={item.id}>{renderItem(item)}</View>)}
      {!result.loading && !result.error && result.data && result.data.totalPages > 1 && (
        <PaginationBar page={result.data} onPageChange={result.setPage} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { marginBottom: Spacing.three },
  results: { gap: Spacing.three, paddingBottom: Spacing.three },
  section: { gap: Spacing.two },
  hint: { color: Brand.textSecondary, fontSize: 14 },
  heading: { color: Brand.text, fontSize: 18, fontWeight: '700' },
});
