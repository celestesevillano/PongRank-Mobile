import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CalendarClock, GitFork, Info, Swords, Trophy } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ActionRow } from '@/components/common/action-row';
import { ScreenState } from '@/components/common/screen-state';
import { CommunityScreen } from '@/components/communities/community-screen';
import { formatLabels, matchArt, MatchBanner, MatchMeta, MatchNotice, MatchState } from '@/components/matches/match-ui';
import { BracketDiagram } from '@/components/tournaments/bracket-diagram';
import { buildBracket, type Bout } from '@/components/tournaments/bracket-model';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { tournamentsService } from '@/services/tournaments.service';

export default function TournamentScreen() {
  const { id: param, diagram } = useLocalSearchParams<{ id: string; diagram?: string }>();
  const id = Number(param);
  const { player } = useSession();
  const detail = useFetch((signal) => tournamentsService.detail(id, signal), [id]);
  const { refetch } = detail;
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));
  const bracket = useMemo(() => publishedBracket(detail.data), [detail.data]);
  const event = detail.data?.tournament;
  const myMatch = detail.data?.matches.find(({ player1, player2, matchId, status }) =>
    status === 'SCHEDULED' && matchId && (player1?.id === player?.id || player2?.id === player?.id));
  const isParticipant = detail.data?.participants.some(({ player: entry }) => entry.id === player?.id);
  const schedule = event?.startDate && new Date(`${event.startDate}-05:00`).toLocaleString('es-PE', {
    timeZone: 'America/Lima', dateStyle: 'medium', timeStyle: 'short',
  });
  const showDiagram = diagram === 'yes';
  return <CommunityScreen title={showDiagram ? 'Diagrama' : event?.name ?? 'Torneo'}
    onBack={() => router.canGoBack() ? router.back() : router.replace('/social')}>
    {detail.loading || detail.error ? <ScreenState loading={detail.loading} error={detail.error} onRetry={refetch} />
      : showDiagram && bracket ? <BracketDiagram bracket={bracket} />
      : event && <>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <MatchBanner title={event.name} tournament>
            {schedule && <MatchMeta icon={CalendarClock} text={schedule} />}
            <MatchMeta icon={Swords} text={formatLabels[event.matchFormat]} />
          </MatchBanner>
          {event.winner ? <MatchState title={event.winner.name} message="Campeón del torneo" art={matchArt.tournamentWin} />
            : myMatch ? <MatchNotice icon={Swords} title="Tu próximo partido"
              message={myMatch.player1?.id === player?.id ? `vs. ${myMatch.player2?.name}` : `vs. ${myMatch.player1?.name}`} />
            : isParticipant ? <MatchNotice icon={Info} title="Sigues el torneo"
              message="Consulta la llave para ver cómo avanzan los cruces." />
            : <MatchNotice icon={Trophy} title="Vista de espectador" message="Puedes seguir los cruces y resultados del torneo." />}
        </ScrollView>
        <View style={styles.footer}><ActionRow>
          {!!myMatch?.matchId && <AuthButton label="Ver mi partida" onPress={() => router.push({ pathname: '/match/[id]', params: { id: myMatch.matchId! } })} />}
          {bracket && <AuthButton label="Diagrama" variant={myMatch ? 'secondary' : 'primary'}
            onPress={() => router.push({ pathname: '/social/tournament', params: { id, diagram: 'yes' } })} />}
        </ActionRow></View>
      </>}
  </CommunityScreen>;
}

function publishedBracket(detail: Awaited<ReturnType<typeof tournamentsService.detail>> | null) {
  if (!detail?.tournament.directElimination) return null;
  const bracket = buildBracket(detail.participants.map(({ player, seed }) => ({
    id: player.id, name: player.name, rating: -seed,
  })));
  if (!bracket) return null;
  const seeds = new Map(detail.participants.map(({ player, seed }) => [player.id, seed]));
  const byPosition = new Map(detail.matches.filter(({ stage }) => stage === 'KNOCKOUT')
    .map((fixture) => [`${fixture.round}-${fixture.bracketPosition}`, fixture]));
  const mainRound = bracket.preliminary.length ? 2 : 1;

  function update(bout: Bout, fixture?: NonNullable<typeof detail>["matches"][number]) {
    if (!fixture) return;
    [fixture.player1, fixture.player2].forEach((player, i) => {
      if (player) bout.slots[i] = { ...bout.slots[i], name: player.name, won: player.id === fixture.winner?.id };
    });
  }
  if (bracket.preliminary.length) {
    for (const fixture of detail.matches) {
      const seed = fixture.player1 && seeds.get(fixture.player1.id);
      if (fixture.round !== 1 || !seed) continue;
      const bout = bracket.preliminary[seed - bracket.directCount - 1];
      if (bout) update(bout, fixture);
    }
  }
  bracket.rounds.forEach(({ bouts }, round) =>
    bouts.forEach((bout, position) => update(bout, byPosition.get(`${mainRound + round}-${position}`))));
  return bracket;
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { gap: Spacing.three, paddingVertical: Spacing.two },
  footer: { paddingVertical: Spacing.three },
});
