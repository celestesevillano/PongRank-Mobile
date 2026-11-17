import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CalendarClock, Clock, Flag, MapPin, Share2, Swords, Users, X } from 'lucide-react-native';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ActionRow } from '@/components/common/action-row';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenState } from '@/components/common/screen-state';
import { matchTime } from '@/components/matches/match-schedule';
import { useLiveMatch } from '@/hooks/use-live-match';
import { LiveScoreboard } from '@/components/matches/live-scoreboard';
import { formatLabels, matchArt, matchPlace, MatchBanner, MatchMeta, MatchNotice, MatchResult, MatchState, shareMatch } from '@/components/matches/match-ui';
import { WhatsAppMatchButton } from '@/components/matches/whatsapp-match-button';
import { PlayerIdentity } from '@/components/pongmigos/pongmigos-ui';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { useMatchAddress } from '@/hooks/use-match-address';
import { matchesService } from '@/services/matches.service';
import type { MatchDetail, SetScore } from '@/types/api';
import { toApiError } from '@/utils/api-error';
import { setsWon } from '@/utils/scoring';

type PlayStage = 'confirmation' | 'ready';
const toMatches = () => router.replace('/matches');

export default function MatchDetailScreen() {
  const { id, origin, place } = useLocalSearchParams<{ id: string; origin?: string; place?: string }>();
  const matchId = Number(id);
  const { data, loading, error, refetch } = useFetch((signal) => matchesService.get(matchId, signal), [matchId]);
  const awaitingChange = (data?.status === 'CREATED' && !data.player2) || data?.status === 'PROPOSED_P1' || data?.status === 'PROPOSED_P2';
  useFocusEffect(useCallback(() => {
    if (!awaitingChange) return;
    const timer = setInterval(refetch, 10000);
    return () => clearInterval(timer);
  }, [awaitingChange, refetch]));

  return <ScreenContainer>
    {data && data.id === matchId ? <MatchContent key={matchId} match={data} origin={origin} initialPlace={place} onChanged={refetch} />
      : <View style={styles.center}><ScreenState loading={loading} error={error} onRetry={refetch} /></View>}
  </ScreenContainer>;
}

function MatchContent({ match, origin, initialPlace, onChanged }: { match: MatchDetail; origin?: string; initialPlace?: string; onChanged: () => void }) {
  const { player } = useSession();
  const { showToast } = useToast();
  const shareCard = useRef<ComponentRef<typeof View>>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<PlayStage>('confirmation');
  const [disputing, setDisputing] = useState(false);
  const [cancelPrompt, setCancelPrompt] = useState(false);
  const [reason, setReason] = useState('');
  const first = match.player1.id === player?.id;
  const participating = !!player && (first || match.player2?.id === player.id);
  const opponent = first ? match.player2 : match.player1;
  const proposed = match.status === 'PROPOSED_P1' || match.status === 'PROPOSED_P2';
  const myProposal = participating && match.status === (first ? 'PROPOSED_P1' : 'PROPOSED_P2');
  const mayReview = participating && proposed && !myProposal;
  const canPlay = participating && match.status === 'CREATED' && !!match.player2 && !!opponent;
  const live = useLiveMatch(match.id, canPlay && stage === 'ready', onChanged);
  const myReady = first ? live.state?.player1Ready : live.state?.player2Ready;
  const theirReady = first ? live.state?.player2Ready : live.state?.player1Ready;
  const playing = !!(myReady && theirReady && live.state?.status === 'CREATED');
  const final = match.status === 'CONFIRMED';
  const cancelled = match.status === 'CANCELLED';
  const waitingRival = match.status === 'CREATED' && !match.player2;
  const place = useMatchAddress(match.latitude, match.longitude) ?? initialPlace ?? matchPlace(match);
  const time = match.scheduledAt ? matchTime(match.scheduledAt) : new Date(match.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const name = opponent?.name ?? 'Tu rival';
  const source = origin ?? (match.matchType === 'FRIEND' ? 'Pongmigos' : match.matchType === 'COMMUNITY' ? 'Comunidad' : match.matchType === 'TOURNAMENT' ? 'Torneo' : 'Partida libre');
  const count = setsWon(match.sets);
  const score = match.sets.length ? (first || !participating ? `${count.player1}–${count.player2}` : `${count.player2}–${count.player1}`) : match.scoreSummary;
  const winner = match.winnerId === match.player1.id ? match.player1.name : match.player2?.name;
  const proposedWinner = count.player1 > count.player2 ? match.player1.name : match.player2?.name;
  const didWin = participating && match.winnerId === player?.id;

  async function run(action: () => Promise<unknown>, message?: string) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      setDisputing(false);
      setCancelPrompt(false);
      if (message) showToast(message);
      onChanged();
    } catch (error) {
      showToast(toApiError(error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  function share(message: string) {
    void shareMatch(shareCard.current, message).catch(() => showToast('No pudimos compartir la partida.', 'error'));
  }

  const matchInfo = <>
    <MatchMeta icon={Users} text={source} color={Brand.red} />
    {!!place && <MatchMeta icon={MapPin} text={place} color={Brand.red} />}
    <MatchMeta icon={CalendarClock} text={time} color={Brand.red} />
    <MatchMeta icon={Swords} text={formatLabels[match.format]} color={Brand.red} />
  </>;
  let body;
  let actions;
  let centered = false;

  if (canPlay && opponent && stage === 'confirmation') {
    centered = true;
    body = <View style={[styles.panel, styles.confirmed]}>
      <MatchState title="¡Partida confirmada!" art={matchArt.confirmed}>
        <View style={styles.identity}><PlayerIdentity player={opponent} showRating /></View>
        {matchInfo}
      </MatchState>
    </View>;
    actions = <ActionRow>
      <AuthButton label="Empezar partida" icon={Swords} onPress={() => setStage('ready')} />
      <WhatsAppMatchButton opponent={opponent} showUnavailable compact />
    </ActionRow>;
  } else if (canPlay && !playing) {
    const ready = !!myReady;
    body = <>
      <Text accessibilityRole="header" style={styles.heading}>Antes de jugar</Text>
      <MatchBanner title={match.tournamentName ?? 'Partida amistosa'}>{matchInfo}</MatchBanner>
      <View style={styles.vsBoard}>
        <Image source={matchArt.versus} style={styles.vsArt} contentFit="cover" contentPosition="bottom center" accessible={false} />
        <View style={styles.vsPlayers}>
          <View style={styles.vsPlayer}><Text style={styles.label}>Tú</Text><Text style={[styles.badge, ready && styles.badgeReady]}>{ready ? 'Listo' : 'Por confirmar'}</Text></View>
          <View style={styles.vs}><Text style={styles.vsText}>VS</Text></View>
          <View style={styles.vsPlayer}><Text numberOfLines={2} style={styles.label}>{name}</Text><Text style={[styles.badge, theirReady && styles.badgeReady]}>{theirReady ? 'Listo' : 'Por confirmar'}</Text></View>
        </View>
      </View>
      {ready ? <MatchNotice icon={Clock} title={`Esperando a ${name}`} message="El marcador se abrirá cuando ambos estén listos." />
        : <Text style={styles.muted}>Confirma que estás listo para empezar.</Text>}
    </>;
    actions = <ActionRow>
      <AuthButton label="Rechazar partida" variant="secondary" onPress={() => setCancelPrompt(true)} />
      <AuthButton label={ready ? 'Esperando al rival' : 'Estoy listo'} disabled={ready || !live.state} loading={live.busy} onPress={() => live.perform('READY')} />
    </ActionRow>;
  } else if (canPlay && live.state) {
    body = <>
      <View style={styles.scoreHeader}><Text accessibilityRole="header" style={styles.heading}>vs. {name}</Text><Text style={styles.muted}>{formatLabels[match.format]}</Text></View>
      <LiveScoreboard state={live.state} opponentName={name} player1IsMe={first} submitting={busy} busy={live.busy}
        onPoint={() => live.perform('POINT')} onUndo={() => live.perform('UNDO')} onSubmit={(sets: SetScore[]) => { void run(() => matchesService.submitScore(match.id, sets)); }} />
    </>;
  } else if (waitingRival) {
    centered = true;
    body = <>
      <View ref={shareCard} collapsable={false} style={[styles.panel, styles.confirmed]}>
        <MatchState title="Esperando rival" message="Tu partida está abierta. Comparte la invitación para que alguien se sume." art={matchArt.rival} />
        {matchInfo}
      </View>
      <AuthButton label="Compartir invitación" icon={Share2} variant="secondary"
        onPress={() => share(`¿Jugamos ping-pong? Partida abierta en PongRank · ${formatLabels[match.format]}${place ? ` · ${place}` : ''}`)} />
    </>;
    actions = <ActionRow>
      {participating && <AuthButton label="Cancelar partida" onPress={() => setCancelPrompt(true)} />}
      <AuthButton label="Ver mis partidas" variant="secondary" onPress={toMatches} />
    </ActionRow>;
  } else if (cancelled) {
    centered = true;
    body = <MatchState title="Partida cancelada" message="Puedes buscar otra o crear una nueva." art={matchArt.cancelled} />;
    actions = <ActionRow>
      <AuthButton label="Nueva partida" onPress={() => router.replace('/new-match')} />
      <AuthButton label="Buscar partida" variant="secondary" onPress={() => router.replace('/find-match')} />
    </ActionRow>;
  } else if (mayReview && disputing) {
    body = <>
      <Text accessibilityRole="header" style={styles.heading}>Disputar resultado</Text>
      <View style={styles.panel}><Text style={styles.label}>vs. {name}</Text><Text style={styles.muted}>Resultado propuesto · {score}</Text></View>
      <Text style={styles.label}>Motivo de la disputa</Text>
      <TextInput accessibilityLabel="Motivo de la disputa" placeholder="Describe qué pasó" placeholderTextColor={Brand.textSecondary}
        value={reason} onChangeText={setReason} style={styles.input} multiline maxLength={500} editable={!busy} />
    </>;
    actions = <ActionRow>
      <AuthButton label="Volver" variant="secondary" disabled={busy} onPress={() => setDisputing(false)} />
      <AuthButton label="Enviar disputa" loading={busy} disabled={!reason.trim()}
        onPress={() => run(() => matchesService.dispute(match.id, reason.trim()))} />
    </ActionRow>;
  } else if (match.status === 'DISPUTED') {
    body = <>
      <Text accessibilityRole="header" style={styles.heading}>Resultado en disputa</Text>
      <MatchNotice icon={Flag} title="Resultado pendiente" message="El marcador reportado sigue en revisión." />
      {!!match.disputeReason && <Text style={styles.muted}>{match.disputeReason}</Text>}
      <Text style={styles.label}>Marcador reportado</Text>
      <View style={styles.panel}>{match.sets.map((set) => <View key={set.setNumber} style={styles.reportRow}>
        <Text style={styles.label}>Set {set.setNumber}</Text><Text style={styles.label}>{set.scorePlayer1}–{set.scorePlayer2}</Text>
      </View>)}</View>
    </>;
  } else if (final || proposed) {
    centered = true;
    const title = final ? (didWin ? '¡Ganaste la partida!' : 'Partida finalizada') : myProposal ? 'Resultado enviado'
      : proposedWinner ? `${proposedWinner} ganó la partida` : 'Revisar resultado';
    const message = final ? (winner ? `Ganó ${winner} · Resultado confirmado` : 'Resultado confirmado')
      : myProposal ? 'Tu rival puede confirmar o disputar el marcador.' : 'Revisa los sets antes de confirmar el resultado.';
    body = <View ref={shareCard} collapsable={false}><MatchResult title={title} message={message} art={final ? (didWin ? matchArt.win : matchArt.loss) : myProposal ? matchArt.sent : matchArt.review}
      score={score} sets={match.sets} reverse={participating && !first} gold={didWin && final} /></View>;
    if (mayReview) actions = <ActionRow>
      <AuthButton label="Confirmar" loading={busy} onPress={() => run(() => matchesService.confirm(match.id))} />
      <AuthButton label="Disputar" variant="secondary" disabled={busy} onPress={() => setDisputing(true)} />
    </ActionRow>;
    if (final && didWin) actions = <ActionRow>
      <AuthButton label="Compartir" icon={Share2} variant="secondary" onPress={() => share(`¡Gané ${score ?? ''} en PongRank! 🏓`)} />
      <AuthButton label="Ver historial" onPress={() => router.replace({ pathname: '/matches', params: { section: 'history' } })} />
    </ActionRow>;
  } else {
    centered = true;
    body = <MatchState title={match.status === 'WALKOVER' ? 'Partida finalizada por incomparecencia' : 'Detalle de la partida'}
      message={match.tournamentName ?? match.communityName ?? name} />;
  }

  return <>
    <AuthButton label="Volver" variant="text" style={styles.back} disabled={busy} onPress={() => {
      if (disputing) setDisputing(false);
      else if (canPlay && stage !== 'confirmation' && !playing) setStage('confirmation');
      else router.canGoBack() ? router.back() : toMatches();
    }} />
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, centered && styles.centered]}>
      {body}
      {canPlay && stage === 'ready' && live.error && <MatchNotice icon={Clock} title="Marcador en vivo" message={live.error.isNetwork ? 'Se perdió la conexión. Estamos intentando reconectar.' : 'No pudimos actualizar el marcador. Revisa el estado antes de continuar.'} />}
    </ScrollView>
    <View style={styles.footer}>{actions ?? <AuthButton label={final ? 'Ver historial' : 'Ver mis partidas'}
      onPress={final ? () => router.replace({ pathname: '/matches', params: { section: 'history' } }) : toMatches} />}</View>
    <ConfirmDialog busy={busy} onCancel={() => setCancelPrompt(false)} confirmation={cancelPrompt ? {
      title: '¿Cancelar la partida?', message: 'La partida dejará de estar activa.', label: 'Cancelar partida',
      cancelLabel: 'Volver', Icon: X, destructive: true, onConfirm: () => { void run(() => matchesService.cancel(match.id)); },
    } : null} />
  </>;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  content: { flexGrow: 1, gap: Spacing.three, paddingBottom: Spacing.three },
  centered: { justifyContent: 'center' },
  back: { alignSelf: 'flex-start', marginTop: 4 },
  heading: { color: Brand.text, fontSize: 25, fontWeight: '800' },
  muted: { color: Brand.textSecondary, fontSize: 13 },
  label: { color: Brand.text, fontWeight: '700', fontSize: 14 },
  panel: { padding: 12, gap: 8, borderWidth: 1, borderColor: Brand.border, borderRadius: 14, backgroundColor: Brand.surface },
  confirmed: { backgroundColor: '#101E25', borderColor: '#2A6674' },
  identity: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', gap: 8 },
  vsBoard: { height: 210, overflow: 'hidden', borderWidth: 1, borderColor: '#563543', borderRadius: 15, backgroundColor: '#111015' },
  vsArt: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 142 },
  vsPlayers: { padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vsPlayer: { flex: 1, alignItems: 'center', gap: 6 },
  badge: { color: Brand.text, fontSize: 11, fontWeight: '600', backgroundColor: '#232328', borderColor: '#494951', borderWidth: 1, borderRadius: 30, paddingHorizontal: 8, paddingVertical: 4 },
  badgeReady: { color: '#93E6B0', backgroundColor: '#122A1E', borderColor: '#347452' },
  vs: { width: 36, height: 36, marginTop: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 1, borderColor: '#9C733B', backgroundColor: '#1C1417' },
  vsText: { color: '#FFD278', fontSize: 11, fontWeight: '800' },
  scoreHeader: { alignItems: 'center', gap: 4 },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  footer: { paddingVertical: Spacing.three },
  input: { textAlignVertical: 'top', minHeight: 100, padding: 12, color: Brand.text, backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border, borderRadius: 12 },
});
