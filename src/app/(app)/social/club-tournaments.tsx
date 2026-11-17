import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CalendarClock, MapPin, Plus, Trophy } from 'lucide-react-native';
import { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenState } from '@/components/common/screen-state';
import { CommunityScreen } from '@/components/communities/community-screen';
import { PongiState } from '@/components/pongmigos/pongmigos-ui';
import { MatchMeta, matchArt } from '@/components/matches/match-ui';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { usePaginated } from '@/hooks/use-paginated';
import { clubsService } from '@/services/clubs.service';
import { tournamentsService, type Tournament } from '@/services/tournaments.service';

function tournamentTime(tournament: Tournament) {
  if (!tournament.startDate) return null;
  return new Date(`${tournament.startDate}-05:00`).toLocaleString('es-PE', {
    timeZone: 'America/Lima', dateStyle: 'medium', timeStyle: 'short',
  });
}

export default function ClubTournamentsScreen() {
  const { clubId: param } = useLocalSearchParams<{ clubId: string }>();
  const clubId = Number(param);
  const { player } = useSession();
  const club = useFetch((signal) => clubsService.detail(clubId, signal), [clubId]);
  const tournaments = usePaginated((params, signal) => tournamentsService.list(clubId, params, signal), [clubId]);
  const { refetch } = tournaments;
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));
  const isAdmin = !!player && club.data?.admin?.id === player.id && club.data.status === 'APPROVED';
  const visible = tournaments.data?.content.filter(({ status }) => status !== 'OPEN' || isAdmin) ?? [];
  const page = tournaments.data;

  return <CommunityScreen title="Torneos" onBack={() => router.canGoBack() ? router.back() : router.replace('/social')}>
    {tournaments.loading || tournaments.error ? <ScreenState loading={tournaments.loading} error={tournaments.error} onRetry={refetch} />
      : page && <FlatList style={styles.list} contentContainerStyle={visible.length ? styles.cards : styles.empty}
        data={visible} keyExtractor={({ id }) => String(id)}
        ListEmptyComponent={<PongiState title="Aún no hay torneos" text="Los torneos del club aparecerán aquí." artwork={require('../../../../assets/images/torneo-club-vacio.webp')} />}
        ListFooterComponent={page.totalPages > 1 ? <PaginationBar page={page} onPageChange={tournaments.setPage} /> : undefined}
        renderItem={({ item }) => {
          const time = tournamentTime(item);
          return <View style={styles.card}>
            {item.status !== 'FINISHED' && <Image source={matchArt.tournamentBanner} style={styles.banner} contentFit="cover" accessible={false} />}
            <View style={styles.cardBody}>
              <View style={styles.titleRow}><Trophy color={Brand.red} size={20} />
                <Text style={styles.status}>{item.status === 'FINISHED' ? 'Finalizado' : item.status === 'OPEN' ? 'Borrador' : 'Llave publicada'}</Text></View>
              <Text style={styles.name}>{item.name}</Text>
              {time && <MatchMeta icon={CalendarClock} text={time} />}
              <MatchMeta icon={MapPin} text={[item.clubName, club.data?.address].filter(Boolean).join(' · ')} />
              <View style={styles.link}><AuthButton label="Ver torneo" variant="text"
                onPress={() => item.status === 'OPEN'
                  ? router.push({ pathname: '/social/bracket-review', params: { tournamentId: item.id } })
                  : router.push({ pathname: '/social/tournament', params: { id: item.id } })} /></View>
            </View>
          </View>;
        }} />}
    {isAdmin && <View style={styles.footer}><AuthButton label="Crear torneo" icon={Plus}
      onPress={() => router.push({ pathname: '/social/create-tournament', params: { clubId } })} /></View>}
  </CommunityScreen>;
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  empty: { flexGrow: 1, justifyContent: 'center' },
  cards: { gap: Spacing.two, paddingVertical: Spacing.two },
  card: { overflow: 'hidden', backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border, borderRadius: 14 },
  banner: { width: '100%', height: 108 },
  cardBody: { padding: Spacing.three, gap: 6 },
  titleRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  status: { color: Brand.red, fontWeight: '700' },
  name: { color: Brand.text, fontSize: 20, fontWeight: '800' },
  link: { alignItems: 'flex-end', borderTopWidth: 1, borderColor: Brand.border, marginTop: 4 },
  footer: { paddingVertical: Spacing.three },
});
