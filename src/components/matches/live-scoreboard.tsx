import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { Brand, Spacing } from '@/constants/theme';
import type { SetScore } from '@/types/api';
import { matchWinner, setWinner, setsWon, type MatchFormat } from '@/utils/scoring';

type LiveScoreboardProps = {
  format: MatchFormat;
  opponentName: string;
  player1IsMe: boolean;
  submitting: boolean;
  onSubmit: (sets: SetScore[]) => void;
};

type Points = { scorePlayer1: number; scorePlayer2: number };

export function LiveScoreboard({ format, opponentName, player1IsMe, submitting, onSubmit }: LiveScoreboardProps) {
  const [finishedSets, setFinishedSets] = useState<SetScore[]>([]);
  const [current, setCurrent] = useState<Points>({ scorePlayer1: 0, scorePlayer2: 0 });

  const currentWinner = setWinner(current);
  const includingCurrent: SetScore[] = currentWinner ? [...finishedSets, { setNumber: finishedSets.length + 1, ...current }] : finishedSets;
  const matchOver = matchWinner(includingCurrent, format) !== null;
  const won = setsWon(includingCurrent);
  const myKey = player1IsMe ? 'scorePlayer1' : 'scorePlayer2';
  const theirKey = player1IsMe ? 'scorePlayer2' : 'scorePlayer1';

  const addPoint = (key: keyof Points) => {
    if (currentWinner) return;
    setCurrent((points) => ({ ...points, [key]: points[key] + 1 }));
  };

  const undo = () => {
    if (current.scorePlayer1 + current.scorePlayer2 === 0) return;
    const key: keyof Points = current.scorePlayer1 >= current.scorePlayer2 ? 'scorePlayer1' : 'scorePlayer2';
    setCurrent((points) => ({ ...points, [key]: points[key] - 1 }));
  };

  const closeSet = () => {
    setFinishedSets((sets) => [...sets, { setNumber: sets.length + 1, ...current }]);
    setCurrent({ scorePlayer1: 0, scorePlayer2: 0 });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.setLabel}>Set {finishedSets.length + 1}</Text>
      <View style={styles.board}>
        <ScoreColumn label="Tú" value={current[myKey]} disabled={currentWinner !== null} onAdd={() => addPoint(myKey)} />
        <View style={styles.divider} />
        <ScoreColumn label={opponentName} value={current[theirKey]} disabled={currentWinner !== null} onAdd={() => addPoint(theirKey)} />
      </View>

      <Text style={styles.sets}>
        Sets: {player1IsMe ? won.player1 : won.player2} - {player1IsMe ? won.player2 : won.player1}
      </Text>

      {currentWinner && !matchOver && <AuthButton label="Siguiente set" onPress={closeSet} />}
      {matchOver && <AuthButton label="Enviar resultado" loading={submitting} onPress={() => onSubmit(includingCurrent)} />}

      <Pressable onPress={undo}>
        <Text style={styles.undo}>Deshacer último punto</Text>
      </Pressable>
    </View>
  );
}

function ScoreColumn({ label, value, disabled, onAdd }: { label: string; value: number; disabled: boolean; onAdd: () => void }) {
  return (
    <View style={styles.column}>
      <Text style={styles.name} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.points}>{value}</Text>
      <Pressable accessibilityLabel={`Sumar punto a ${label}`} disabled={disabled} onPress={onAdd} style={[styles.plus, disabled && styles.plusDisabled]}>
        <Text style={styles.plusLabel}>+1</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  setLabel: { color: Brand.textSecondary, textAlign: 'center' },
  board: { flexDirection: 'row', alignItems: 'center' },
  column: { flex: 1, alignItems: 'center', gap: Spacing.two },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: Brand.border },
  name: { color: Brand.text, fontWeight: '700' },
  points: { color: Brand.red, fontSize: 72, fontWeight: '800' },
  plus: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: Brand.red, alignItems: 'center', justifyContent: 'center' },
  plusDisabled: { opacity: 0.3 },
  plusLabel: { color: Brand.red, fontSize: 22, fontWeight: '800' },
  sets: { color: Brand.textSecondary, textAlign: 'center' },
  undo: { color: Brand.textSecondary, textAlign: 'center', textDecorationLine: 'underline' },
});
