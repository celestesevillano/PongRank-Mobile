import { StyleSheet, Text, View } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';
import type { MatchResponse } from '@/types/api';

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Esperando rival',
  PROPOSED_P1: 'Por confirmar',
  PROPOSED_P2: 'Por confirmar',
  CONFIRMED: 'Confirmada',
  DISPUTED: 'En disputa',
  CANCELLED: 'Cancelada',
  WALKOVER: 'Walkover',
};

export function MatchCard({ match, playerId }: { match: MatchResponse; playerId: number }) {
  const opponent = match.player1.id === playerId ? match.player2 : match.player1;
  const didWin = match.winnerId !== null && match.winnerId === playerId;
  const delta = match.player1.id === playerId ? match.ratingDeltaP1 : match.ratingDeltaP2;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.opponent}>vs {opponent?.name ?? 'Rival por definir'}</Text>
        <Text style={styles.status}>{STATUS_LABELS[match.status] ?? match.status}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.meta}>
          {match.format} · {match.communityName ?? match.tournamentName ?? 'Partida libre'}
        </Text>
        {match.scoreSummary && (
          <Text style={[styles.score, { color: didWin ? Brand.text : Brand.textSecondary }]}>{match.scoreSummary}</Text>
        )}
      </View>
      {delta !== null && delta !== undefined && (
        <Text style={[styles.delta, { color: delta >= 0 ? '#3DDC84' : Brand.red }]}>
          {delta >= 0 ? '+' : ''}
          {Math.round(delta)} rating
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Brand.surface, borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one, borderWidth: 1, borderColor: Brand.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  opponent: { color: Brand.text, fontSize: 16, fontWeight: '700', flexShrink: 1 },
  status: { color: Brand.red, fontSize: 12, fontWeight: '700' },
  meta: { color: Brand.textSecondary, fontSize: 13, flexShrink: 1 },
  score: { fontSize: 14, fontWeight: '700' },
  delta: { fontSize: 13, fontWeight: '700' },
});
