import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { LocationNotice } from '@/components/common/location-notice';
import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenState } from '@/components/common/screen-state';
import { Brand, Spacing } from '@/constants/theme';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { useLocation } from '@/hooks/use-location';
import { matchesService, type Coordinates } from '@/services/matches.service';
import type { MatchResponse } from '@/types/api';
import { toApiError } from '@/utils/api-error';

export default function FindMatchScreen() {
  const { coords, status, retry } = useLocation();

  return (
    <ScreenContainer title="Buscar partida">
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ Volver</Text>
      </Pressable>
      {status === 'ready' && coords ? <OpenMatches coords={coords} /> : <LocationNotice status={status === 'ready' ? 'unavailable' : status} onRetry={retry} />}
    </ScreenContainer>
  );
}

function OpenMatches({ coords }: { coords: Coordinates }) {
  const { showToast } = useToast();
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const { data, loading, error, refetch } = useFetch((signal) => matchesService.open(coords, signal), [coords.latitude, coords.longitude]);

  const join = async (match: MatchResponse) => {
    setJoiningId(match.id);
    try {
      await matchesService.join(match.id, coords);
      showToast(`¡Partida confirmada con ${match.player1.name}!`);
      router.replace('/matches');
    } catch (err) {
      showToast(toApiError(err).message, 'error');
      refetch();
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenState loading={loading} error={error} empty={data?.length === 0} emptyMessage="No hay partidas libres cerca de ti con tu nivel. Crea una y espera rival." onRetry={refetch} />
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => String(item.id)}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.flex}>
              <Text style={styles.name}>{item.player1.name}</Text>
              <Text style={styles.meta}>
                {Math.round(item.player1.ratingGlicko)} · {item.format}
              </Text>
            </View>
            <AuthButton label="Unirme" loading={joiningId === item.id} disabled={joiningId !== null} onPress={() => join(item)} style={styles.join} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  back: { color: Brand.textSecondary, marginBottom: Spacing.three },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, backgroundColor: Brand.surface, borderRadius: Spacing.three, padding: Spacing.three, borderWidth: 1, borderColor: Brand.border },
  name: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  meta: { color: Brand.textSecondary, fontSize: 13 },
  join: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
});
