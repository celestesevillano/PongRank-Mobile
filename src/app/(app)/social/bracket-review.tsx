import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { BracketReview } from '@/components/tournaments/bracket-review';
import { ScreenState } from '@/components/common/screen-state';
import { CommunityScreen } from '@/components/communities/community-screen';
import { Brand, Spacing } from '@/constants/theme';
import { useFetch } from '@/hooks/use-fetch';
import { http } from '@/services/http';
import type { PlayerSummary } from '@/types/api';
import { normalizePage } from '@/utils/pagination';

type Event = { id: number; name: string; status: string };
type Registration = { player: PlayerSummary };

export default function BracketReviewScreen() {
  const { clubId, tournamentId } = useLocalSearchParams<{ clubId?: string; tournamentId?: string }>();
  const id = Number(tournamentId);
  const validTournament = Number.isSafeInteger(id) && id > 0;
  const back = () => router.canGoBack() ? router.back() : router.replace('/social');
  return (
    <CommunityScreen title="Revisar llave" onBack={back}>
      {validTournament ? <TournamentBracket key={id} id={id} />
        : <ClubDrafts clubId={Number(clubId)} />}
    </CommunityScreen>
  );
}

function TournamentBracket({ id }: { id: number }) {
  const participants = useFetch(async (signal) => {
    const { data } = await http.get<Registration[]>(`/tournaments/${id}/participants`, { signal });
    return data.map(({ player }) => ({ id: player.id, name: player.name, rating: player.ratingGlicko }));
  }, [id]);

  if (participants.loading || participants.error) {
    return <ScreenState loading={participants.loading} error={participants.error} errorMessage="No pudimos cargar los participantes." onRetry={participants.refetch} />;
  }
  return <BracketReview entrants={participants.data ?? []} />;
}

function ClubDrafts({ clubId }: { clubId: number }) {
  const validClub = Number.isSafeInteger(clubId) && clubId > 0;
  const drafts = useFetch(async (signal) => {
    if (!validClub) return [];
    const tournaments: Event[] = [];
    for (let page = 0; ; page++) {
      const { data } = await http.get(`/tournaments/clubs/${clubId}`, { signal, params: { page, size: 20 } });
      const result = normalizePage<Event>(data);
      tournaments.push(...result.content.filter(({ status }) => status === 'OPEN'));
      if (result.last) return tournaments;
    }
  }, [clubId, validClub]);

  return (
    <>
      <ScreenState loading={drafts.loading} error={drafts.error} errorMessage="No pudimos cargar los torneos." onRetry={drafts.refetch} />
      {!drafts.loading && !drafts.error ? (
        <FlatList data={drafts.data ?? []} keyExtractor={({ id }) => String(id)} contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No hay torneos pendientes de publicar.</Text>}
          renderItem={({ item }) => <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <AuthButton label="Diagrama" variant="secondary" onPress={() => router.push({ pathname: '/social/bracket-review', params: { tournamentId: item.id } })} />
          </View>}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two, paddingBottom: Spacing.three },
  card: { padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderColor: Brand.border, borderRadius: 14, backgroundColor: Brand.surface },
  name: { color: Brand.text, fontWeight: '700', fontSize: 16 },
  empty: { color: Brand.textSecondary },
});
