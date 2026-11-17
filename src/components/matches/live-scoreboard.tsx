import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { matchArt, MatchResult } from '@/components/matches/match-ui';
import { Brand, Spacing } from '@/constants/theme';
import type { LiveMatchState } from '@/services/matches.service';
import type { SetScore } from '@/types/api';
import { setsWon } from '@/utils/scoring';

export function LiveScoreboard({ state, opponentName, player1IsMe, busy, submitting, onPoint, onUndo, onSubmit }: {
  state: LiveMatchState;
  opponentName: string;
  player1IsMe: boolean;
  busy: boolean;
  submitting: boolean;
  onPoint: () => void;
  onUndo: () => void;
  onSubmit: (sets: SetScore[]) => void;
}) {
  const [reviewing, setReviewing] = useState(false);
  const sets = state.completedSets;
  const won = setsWon(sets);
  const mySets = player1IsMe ? won.player1 : won.player2;
  const rivalSets = player1IsMe ? won.player2 : won.player1;

  if (reviewing && state.finished) return <View style={styles.container}>
    <MatchResult title={mySets > rivalSets ? 'Ganaste la partida' : 'Terminó la partida'} message="Revisa los sets antes de enviar el resultado."
      score={`${mySets}–${rivalSets}`} art={matchArt.send} sets={sets} reverse={!player1IsMe} />
    <AuthButton label="Enviar resultado" icon={Send} loading={submitting} disabled={busy} onPress={() => onSubmit(sets)} />
    <AuthButton label="Volver al marcador" variant="text" disabled={submitting} onPress={() => setReviewing(false)} />
  </View>;

  const first = state.scorePlayer1;
  const second = state.scorePlayer2;
  const mine = <ScoreColumn label="Tú" value={player1IsMe ? first : second} disabled={busy || submitting || state.finished} onAdd={onPoint} />;
  const rival = <ScoreColumn label={opponentName} value={player1IsMe ? second : first} />;
  return <View style={styles.container}>
    <Text style={styles.sets}>Sets · {mySets}–{rivalSets}</Text>
    <View style={styles.previous}>{sets.map((set) => <Text key={set.setNumber} style={styles.previousSet}>
      Set {set.setNumber} · {set.scorePlayer1}–{set.scorePlayer2}
    </Text>)}</View>
    <Text style={styles.setLabel}>Set {sets.length + Number(!state.finished)}</Text>
    <View style={styles.board}>{player1IsMe ? <>{mine}{rival}</> : <>{rival}{mine}</>}</View>
    <AuthButton label="Deshacer último punto" variant={state.finished ? 'secondary' : 'primary'} style={styles.undo}
      disabled={busy || submitting || state.lastPointBy !== (player1IsMe ? 1 : 2)} onPress={onUndo} />
    {state.finished && <AuthButton label="Revisar marcador" disabled={busy} onPress={() => setReviewing(true)} />}
  </View>;
}

function ScoreColumn({ label, value, disabled, onAdd }: { label: string; value: number; disabled?: boolean; onAdd?: () => void }) {
  return (
    <View style={[styles.column, !onAdd && styles.rival]}>
      <Text style={styles.name} numberOfLines={1}>{label}</Text>
      <Text accessibilityLiveRegion="polite" style={[styles.points, !onAdd && styles.rivalPoints]}>{value}</Text>
      {onAdd ? <Pressable accessibilityRole="button" accessibilityLabel="Sumar un punto propio" disabled={disabled}
        onPress={onAdd} style={[styles.plus, disabled && styles.plusDisabled]}>
        <Text style={styles.plusLabel}>+1 punto</Text>
      </Pressable> : <Text style={styles.readonly}>Marcador del rival</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  setLabel: { color: Brand.textSecondary, textAlign: 'center' },
  board: { flexDirection: 'row', gap: 9 },
  column: { flex: 1, minWidth: 0, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#71333C', backgroundColor: '#241419', borderRadius: 14, padding: 9 },
  rival: { borderColor: '#2A535D', backgroundColor: '#101F25' },
  name: { color: Brand.text, fontWeight: '700', alignSelf: 'stretch', textAlign: 'center' },
  points: { color: '#FF5B66', fontSize: 76, fontWeight: '900', fontVariant: ['tabular-nums'] },
  rivalPoints: { color: Brand.cyan },
  plus: { minHeight: 44, alignSelf: 'stretch', borderRadius: 10, backgroundColor: Brand.red, alignItems: 'center', justifyContent: 'center' },
  plusDisabled: { opacity: 0.4 },
  plusLabel: { color: Brand.text, fontWeight: '800' },
  readonly: { height: 44, paddingTop: 12, color: Brand.textSecondary, fontSize: 12 },
  sets: { color: Brand.cyan, textAlign: 'right', fontWeight: '700' },
  previous: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  previousSet: { color: Brand.textSecondary, fontSize: 12 },
  undo: { alignSelf: 'center' },
});
