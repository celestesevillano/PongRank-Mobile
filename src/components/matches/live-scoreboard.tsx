import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { matchArt, MatchResult } from '@/components/matches/match-ui';
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

  const [moves, setMoves] = useState<(keyof Points)[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const currentWinner = setWinner(current);
  const includingCurrent: SetScore[] = currentWinner ? [...finishedSets, { setNumber: finishedSets.length + 1, ...current }] : finishedSets;
  const matchOver = matchWinner(includingCurrent, format) !== null;
  const won = setsWon(includingCurrent);
  const myKey = player1IsMe ? 'scorePlayer1' : 'scorePlayer2';
  const theirKey = player1IsMe ? 'scorePlayer2' : 'scorePlayer1';

  const addPoint = (key: keyof Points) => {
    if (currentWinner) return;
    setCurrent((points) => ({ ...points, [key]: points[key] + 1 }));
    setMoves((previous) => [...previous, key]);
  };

  const undo = () => {
    const key = moves.at(-1);
    if (!key) return;
    setMoves((previous) => previous.slice(0, -1));
    setCurrent((points) => ({ ...points, [key]: points[key] - 1 }));
  };

  const closeSet = () => {
    setFinishedSets((sets) => [...sets, { setNumber: sets.length + 1, ...current }]);
    setCurrent({ scorePlayer1: 0, scorePlayer2: 0 });
    setMoves([]);
  };

  const mySets = player1IsMe ? won.player1 : won.player2;
  const rivalSets = player1IsMe ? won.player2 : won.player1;
  if (reviewing && matchOver) return <View style={styles.container}>
    <MatchResult title={mySets > rivalSets ? 'Ganaste la partida' : 'Terminó la partida'}
      message="Revisa los sets antes de enviar el resultado." score={`${mySets}–${rivalSets}`} art={matchArt.send}
      sets={includingCurrent} reverse={!player1IsMe} />
    <AuthButton label="Enviar resultado" icon={Send} loading={submitting} onPress={() => onSubmit(includingCurrent)} />
    <AuthButton label="Volver al marcador" variant="text" disabled={submitting} onPress={() => setReviewing(false)} />
  </View>;

  return (
    <View style={styles.container}>
      <Text style={styles.sets}>Sets · {mySets}–{rivalSets}</Text>
      <View style={styles.previous}>{finishedSets.map((set) => <Text key={set.setNumber} style={styles.previousSet}>
        Set {set.setNumber} · {set[myKey]}–{set[theirKey]}
      </Text>)}</View>
      <Text style={styles.setLabel}>Set {finishedSets.length + 1}</Text>
      <View style={styles.board}>
        <ScoreColumn label="Tú" value={current[myKey]} disabled={currentWinner !== null} onAdd={() => addPoint(myKey)} />
        <ScoreColumn rival label={opponentName} value={current[theirKey]} disabled={currentWinner !== null} onAdd={() => addPoint(theirKey)} />
      </View>

      <AuthButton label="Deshacer último punto" variant="secondary" style={styles.undo} disabled={!moves.length} onPress={undo} />
      {currentWinner && !matchOver && <AuthButton label="Siguiente set" onPress={closeSet} />}
      {matchOver && <AuthButton label="Revisar marcador" onPress={() => setReviewing(true)} />}
    </View>
  );
}

function ScoreColumn({ rival, label, value, disabled, onAdd }: { rival?: boolean; label: string; value: number; disabled: boolean; onAdd: () => void }) {
  return (
    <View style={[styles.column, rival && styles.rival]}>
      <Text style={styles.name} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.points, rival && styles.rivalPoints]}>{value}</Text>
      <Pressable accessibilityLabel={`Sumar punto a ${label}`} disabled={disabled} onPress={onAdd} style={[styles.plus, disabled && styles.plusDisabled]}>
        <Text style={styles.plusLabel}>+1 punto</Text>
      </Pressable>
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
  sets: { color: Brand.cyan, textAlign: 'right', fontWeight: '700' },
  previous: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  previousSet: { color: Brand.textSecondary, fontSize: 12 },
  undo: { alignSelf: 'center' },
});
