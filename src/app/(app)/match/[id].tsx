import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenState } from '@/components/common/screen-state';
import { LiveScoreboard } from '@/components/matches/live-scoreboard';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { matchesService } from '@/services/matches.service';
import type { MatchDetail, SetScore } from '@/types/api';
import { toApiError } from '@/utils/api-error';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Number(id);
  const { data, loading, error, refetch } = useFetch((signal) => matchesService.get(matchId, signal), [matchId]);

  return (
    <ScreenContainer title="Partida">
      <ScreenState loading={loading} error={error} onRetry={refetch} />
      {data && <MatchContent match={data} onChanged={refetch} />}
    </ScreenContainer>
  );
}

function MatchContent({ match, onChanged }: { match: MatchDetail; onChanged: () => void }) {
  const { player } = useSession();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [reason, setReason] = useState('');

  const isPlayer1 = match.player1.id === player?.id;
  const opponent = isPlayer1 ? match.player2 : match.player1;
  const proposedByMe = (match.status === 'PROPOSED_P1' && isPlayer1) || (match.status === 'PROPOSED_P2' && !isPlayer1);
  const awaitingMyReview = (match.status === 'PROPOSED_P1' || match.status === 'PROPOSED_P2') && !proposedByMe;
  const canScore = match.status === 'CREATED' && match.player2 !== null;

  const run = async (action: () => Promise<unknown>, successMessage: string) => {
    setBusy(true);
    try {
      await action();
      showToast(successMessage);
      onChanged();
    } catch (err) {
      showToast(toApiError(err).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const submitScore = (sets: SetScore[]) => run(() => matchesService.submitScore(match.id, sets), 'Resultado enviado. Falta que tu rival lo confirme.');

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.versus}>vs {opponent?.name ?? 'Rival por definir'}</Text>
      <Text style={styles.meta}>
        {match.format} · {match.communityName ?? 'Partida libre'}
      </Text>

      {canScore && <LiveScoreboard format={match.format} opponentName={opponent?.name ?? 'Rival'} player1IsMe={isPlayer1} submitting={busy} onSubmit={submitScore} />}

      {!canScore && match.sets.length > 0 && (
        <View style={styles.sets}>
          {match.sets.map((set) => (
            <Text key={set.id} style={styles.setRow}>
              Set {set.setNumber}: {set.scorePlayer1} - {set.scorePlayer2}
            </Text>
          ))}
          {match.scoreSummary && <Text style={styles.summary}>{match.scoreSummary}</Text>}
        </View>
      )}

      {match.status === 'CREATED' && !match.player2 && <Text style={styles.meta}>Esperando que un rival se una a tu partida.</Text>}
      {proposedByMe && <Text style={styles.meta}>Esperando que tu rival confirme el resultado.</Text>}
      {match.status === 'CONFIRMED' && <Text style={styles.meta}>Partida confirmada.</Text>}
      {match.status === 'DISPUTED' && <Text style={styles.meta}>Resultado en disputa: {match.disputeReason}</Text>}

      {awaitingMyReview && !disputing && (
        <View style={styles.actions}>
          <AuthButton label="Confirmar resultado" loading={busy} onPress={() => run(() => matchesService.confirm(match.id), 'Resultado confirmado.')} />
          <AuthButton label="Disputar resultado" variant="ghost" disabled={busy} onPress={() => setDisputing(true)} />
        </View>
      )}

      {awaitingMyReview && disputing && (
        <View style={styles.actions}>
          <TextInput
            style={styles.input}
            placeholder="¿Por qué no estás de acuerdo?"
            placeholderTextColor={Brand.textSecondary}
            value={reason}
            onChangeText={setReason}
            multiline
            maxLength={500}
          />
          <AuthButton
            label="Enviar disputa"
            loading={busy}
            disabled={reason.trim().length === 0}
            onPress={() => run(() => matchesService.dispute(match.id, reason.trim()), 'Disputa enviada.')}
          />
          <AuthButton label="Cancelar" variant="ghost" disabled={busy} onPress={() => setDisputing(false)} />
        </View>
      )}

      <AuthButton label="Volver a mis partidas" variant="ghost" onPress={() => router.replace('/matches')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three, paddingBottom: Spacing.five },
  versus: { color: Brand.text, fontSize: 22, fontWeight: '800' },
  meta: { color: Brand.textSecondary, fontSize: 14 },
  sets: { backgroundColor: Brand.surface, borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
  setRow: { color: Brand.text, fontWeight: '600' },
  summary: { color: Brand.red, fontWeight: '800', marginTop: Spacing.one },
  actions: { gap: Spacing.two },
  input: { backgroundColor: Brand.surface, borderRadius: Spacing.three, borderWidth: 1, borderColor: Brand.border, color: Brand.text, padding: Spacing.three, minHeight: 80 },
});
