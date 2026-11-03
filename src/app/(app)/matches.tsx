import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenState } from '@/components/common/screen-state';
import { MatchCard } from '@/components/matches/match-card';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { usePaginated } from '@/hooks/use-paginated';
import { matchesService } from '@/services/matches.service';

const FILTERS = [
  { label: 'Todas', value: undefined },
  { label: 'Confirmadas', value: 'CONFIRMED' },
  { label: 'En disputa', value: 'DISPUTED' },
] as const;

export default function MatchesScreen() {
  const { player } = useSession();
  const playerId = player?.id ?? 0;
  const [status, setStatus] = useState<string | undefined>(undefined);

  const matches = usePaginated((params, signal) => matchesService.byPlayer(playerId, { ...params, status }, signal), [playerId, status]);

  const changeFilter = (value: string | undefined) => {
    setStatus(value);
    matches.setPage(0);
  };

  return (
    <ScreenContainer title="Partidas">
      <View style={styles.filters}>
        {FILTERS.map((filter) => (
          <Pressable key={filter.label} onPress={() => changeFilter(filter.value)} style={[styles.chip, status === filter.value && styles.chipActive]}>
            <Text style={styles.chipLabel}>{filter.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScreenState
        loading={matches.loading}
        error={matches.error}
        empty={matches.data?.content.length === 0}
        emptyMessage="No hay partidas con este filtro."
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  chip: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: 999, backgroundColor: Brand.surface },
  chipActive: { backgroundColor: Brand.red },
  chipLabel: { color: Brand.text, fontWeight: '600', fontSize: 13 },
});
