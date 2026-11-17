import { router } from 'expo-router';
import { MapPin, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatLabels, matchPlace, MatchMeta } from '@/components/matches/match-ui';
import { PlayerIdentity } from '@/components/pongmigos/pongmigos-ui';
import { Brand, Spacing } from '@/constants/theme';
import type { MatchResponse } from '@/types/api';
import { useMatchAddress } from '@/hooks/use-match-address';

export function MatchCard({ match, playerId }: { match: MatchResponse; playerId: number }) {
  const isFirst = match.player1.id === playerId;
  const opponent = isFirst ? match.player2 : match.player1;
  const proposed = match.status === 'PROPOSED_P1' || match.status === 'PROPOSED_P2';
  const mine = match.status === (isFirst ? 'PROPOSED_P1' : 'PROPOSED_P2');
  const waiting = match.status === 'CREATED' && !match.player2;
  const final = match.status === 'CONFIRMED';
  const won = match.winnerId === playerId;
  const tone = final && match.winnerId ? (won ? styles.win : styles.loss) : waiting ? styles.waiting : proposed ? styles.pending : styles.neutral;
  const title = final ? (match.winnerId ? (won ? 'Victoria' : 'Derrota') : 'Finalizada')
    : proposed ? (mine ? 'Resultado enviado' : 'Resultado por confirmar')
    : waiting ? 'Esperando rival' : match.status === 'CREATED' ? 'Partida confirmada'
    : match.status === 'DISPUTED' ? 'En disputa' : match.status === 'CANCELLED' ? 'Cancelada' : 'Finalizada';
  const address = useMatchAddress(final ? null : match.latitude, final ? null : match.longitude);
  const place = address ?? matchPlace(match);
  const result = match.scoreSummary?.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  const score = result && !isFirst && opponent ? `${result[2]}–${result[1]}` : match.scoreSummary;

  return (
    <Pressable accessibilityRole="button" style={[styles.card, tone]} onPress={() => router.push(`/match/${match.id}`)}>
      <Text style={[styles.badge, tone]}>{title}</Text>
      <View style={styles.row}>
        {opponent ? <PlayerIdentity player={opponent} showRating={!final} /> : <>
          <View style={styles.avatar}><UserRound size={19} color="#FFD278" /></View><Text style={styles.title}>Partida abierta</Text>
        </>}
        {!!score && <Text style={styles.score}>{score}</Text>}
      </View>
      <View style={styles.row}>
        <Text style={styles.meta}>{formatLabels[match.format]}</Text>
        <Text style={styles.action}>{final ? 'Ver resultado' : proposed && !mine ? 'Revisar resultado' : 'Ver partida'}</Text>
      </View>
      {!!place && !final && <MatchMeta icon={MapPin} text={place} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 13, padding: 10, gap: 5, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, justifyContent: 'space-between' },
  badge: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '700', paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderRadius: 6 },
  win: { color: '#93E6B0', borderColor: '#347452', backgroundColor: '#12251D' },
  loss: { color: '#FF9EA5', borderColor: '#763840', backgroundColor: '#24171D' },
  waiting: { color: '#FFD278', borderColor: '#675026', backgroundColor: '#241D16' },
  pending: { color: '#9CEBF4', borderColor: '#387584', backgroundColor: '#14262D' },
  neutral: { color: Brand.text, borderColor: Brand.border, backgroundColor: Brand.surface },
  title: { color: Brand.text, fontWeight: '700', flex: 1 },
  meta: { color: Brand.textSecondary, fontSize: 12 },
  score: { color: Brand.text, fontWeight: '800', fontSize: 21, fontVariant: ['tabular-nums'] },
  action: { color: Brand.cyan, fontWeight: '700', fontSize: 12 },
  avatar: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: '#382A16' },
});
