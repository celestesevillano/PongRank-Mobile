import { router } from 'expo-router';
import { ChevronLeft, Play, Trophy } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { scoreColor } from '@/components/coach/live-metrics';
import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenState } from '@/components/common/screen-state';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { usePaginated } from '@/hooks/use-paginated';
import { trainingService } from '@/services/training.service';
import type { TrainingSessionResponse } from '@/types/api';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function CoachHistoryScreen() {
  const { player } = useSession();
  const playerId = player?.id ?? 0;
  const history = usePaginated((params, signal) => trainingService.history(playerId, params, signal), [playerId]);
  const sessions = history.data?.content ?? [];

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" hitSlop={12} onPress={() => (router.canGoBack() ? router.back() : router.replace('/coach'))}>
          <ChevronLeft color={Brand.text} size={26} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>Historial de entrenamiento</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ScreenState
          loading={history.loading && !history.data}
          error={history.error}
          empty={!!history.data && sessions.length === 0}
          emptyMessage="Aún no tienes sesiones guardadas."
          onRetry={history.refetch}
        />
        {history.data && sessions.length === 0 && <AuthButton label="Hacer mi primera sesión" icon={Play} onPress={() => router.replace('/coach')} />}
        {sessions.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
        {history.data && history.data.totalPages > 1 && <PaginationBar page={history.data} onPageChange={history.setPage} />}
      </ScrollView>
    </ScreenContainer>
  );
}

function SessionRow({ session }: { session: TrainingSessionResponse }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`Sesión del ${formatDate(session.createdAt)}: postura ${Math.round(session.postureScore)} de 100, swing ${session.swingVelocityMax.toFixed(1)} metros por segundo`}>
      <View style={styles.rowHeader}>
        <Text style={styles.date}>{formatDate(session.createdAt)}</Text>
        <Text style={styles.duration}>{session.durationSeconds} s</Text>
      </View>
      <View style={styles.metrics}>
        <Metric label="Postura" value={`${Math.round(session.postureScore)}`} color={scoreColor(session.postureScore)} />
        <Metric label="Swing" value={`${session.swingVelocityMax.toFixed(1)} m/s`} color={Brand.cyan} />
        <Metric label="Rodillas" value={session.kneeFlexionAngle === null ? '—' : `${Math.round(session.kneeFlexionAngle)}°`} color={Brand.cyan} />
      </View>
      {session.newPersonalBest && (
        <View style={styles.best}>
          <Trophy color="#FFD278" size={14} />
          <Text style={styles.bestText}>Récord personal</Text>
        </View>
      )}
    </View>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginVertical: Spacing.three },
  title: { color: Brand.text, fontSize: 22, fontWeight: '800', flexShrink: 1 },
  content: { gap: Spacing.three, paddingBottom: Spacing.five },
  row: { gap: Spacing.two, padding: Spacing.three, borderRadius: 16, backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { color: Brand.text, fontSize: 15, fontWeight: '700' },
  duration: { color: Brand.textSecondary, fontSize: 14, fontVariant: ['tabular-nums'] },
  metrics: { flexDirection: 'row' },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  metricLabel: { color: Brand.textSecondary, fontSize: 12, fontWeight: '600' },
  best: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, alignSelf: 'flex-start', paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: '#FFD278' },
  bestText: { color: '#FFD278', fontSize: 12, fontWeight: '700' },
});
