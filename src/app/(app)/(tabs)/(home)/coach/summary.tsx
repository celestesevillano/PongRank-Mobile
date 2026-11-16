import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, CloudOff, Dumbbell, History, Lock, RotateCw, Trophy } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { KneeGauge } from '@/components/coach/knee-gauge';
import { scoreColor } from '@/components/coach/live-metrics';
import { ScreenContainer } from '@/components/common/screen-container';
import { CoachExercises, type CoachExercise } from '@/constants/coach';
import { Brand, Spacing } from '@/constants/theme';
import { usePlan } from '@/context/plan';
import { useSession } from '@/context/session';
import type { SessionSummary } from '@/hooks/use-coach-analysis';
import { trainingService } from '@/services/training.service';
import { isRetryableFailure, trainingQueue } from '@/services/training-queue';
import { toApiError } from '@/utils/api-error';

type Result = SessionSummary & { exercise: CoachExercise };
type SaveState = { kind: 'saving' } | { kind: 'saved'; personalBest: boolean } | { kind: 'queued' } | { kind: 'forbidden' } | { kind: 'failed'; message: string };

function parseResult(raw: string | undefined): Result | null {
  try {
    const parsed = raw ? (JSON.parse(raw) as Result) : null;
    return parsed && typeof parsed.postureScore === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

export default function CoachSummaryScreen() {
  const { data } = useLocalSearchParams<{ data?: string }>();
  const result = useMemo(() => parseResult(data), [data]);
  const { player } = useSession();
  const { openPlans } = usePlan();
  const [save, setSave] = useState<SaveState>({ kind: 'saving' });
  const attempted = useRef(false);

  const submit = useCallback(async () => {
    if (!result || !player) return;
    const input = {
      swingVelocityMax: result.swingVelocityMax,
      postureScore: result.postureScore,
      durationSeconds: result.durationSeconds,
      kneeFlexionAngle: result.kneeFlexionAngle,
      shoulderRotationAngle: result.shoulderRotationAngle,
    };
    setSave({ kind: 'saving' });
    try {
      const saved = await trainingService.submit(input);
      setSave({ kind: 'saved', personalBest: saved.newPersonalBest });
      trainingQueue.flush(player.id).catch(() => undefined);
    } catch (error) {
      if (isRetryableFailure(error)) {
        await trainingQueue.enqueue(player.id, input);
        setSave({ kind: 'queued' });
      } else if (toApiError(error).status === 403) {
        setSave({ kind: 'forbidden' });
      } else {
        setSave({ kind: 'failed', message: toApiError(error).message });
      }
    }
  }, [result, player]);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    submit();
  }, [submit]);

  if (!result) {
    return (
      <ScreenContainer title="Resumen">
        <Text style={styles.body}>No encontramos los datos de esta sesión.</Text>
        <AuthButton label="Volver al Coach" onPress={() => router.replace('/coach')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver al Coach" hitSlop={12} onPress={() => router.replace('/coach')}>
            <ChevronLeft color={Brand.text} size={26} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>¡Sesión terminada!</Text>
        </View>
        <Text style={styles.subtitle}>{CoachExercises[result.exercise].title} · {result.durationSeconds} s</Text>

        <SaveBanner state={save} onRetry={submit} onPlans={openPlans} />

        <View style={styles.card}>
          <KneeGauge angle={result.kneeFlexionAngle ?? null} />
          <View style={styles.grid}>
            <Stat label="Postura media" value={`${Math.round(result.postureScore)}`} unit="/100" color={scoreColor(result.postureScore)} />
            <Stat label="Swing máximo" value={result.swingVelocityMax.toFixed(1)} unit="m/s" color={Brand.cyan} />
            <Stat label="Golpes" value={`${result.swings}`} unit="" color={Brand.cyan} />
            <Stat label="Rotación de hombros" value={result.shoulderRotationAngle === undefined ? '—' : `${Math.round(Math.abs(result.shoulderRotationAngle))}`} unit="°" color={Brand.cyan} />
          </View>
        </View>

        <AuthButton label="Elegir otro ejercicio" icon={Dumbbell} onPress={() => router.replace('/coach')} />
        <AuthButton label="Ver mi historial" icon={History} variant="secondary" onPress={() => router.replace('/coach/history')} />
      </ScrollView>
    </ScreenContainer>
  );
}

function SaveBanner({ state, onRetry, onPlans }: { state: SaveState; onRetry: () => void; onPlans: () => void }) {
  if (state.kind === 'saving') {
    return (
      <View style={styles.banner}>
        <ActivityIndicator color={Brand.cyan} />
        <Text style={styles.bannerText}>Guardando en tu historial…</Text>
      </View>
    );
  }
  if (state.kind === 'saved') {
    return (
      <View style={[styles.banner, state.personalBest && styles.bannerGold]} accessibilityLiveRegion="polite">
        {state.personalBest && <Trophy color="#FFD278" size={20} />}
        <Text style={styles.bannerText}>{state.personalBest ? '¡Nuevo récord personal! Guardado en tu historial.' : 'Guardado en tu historial.'}</Text>
      </View>
    );
  }
  if (state.kind === 'queued') {
    return (
      <View style={styles.banner} accessibilityRole="alert">
        <CloudOff color={Brand.cyan} size={20} />
        <Text style={styles.bannerText}>Sin conexión. La guardamos en tu teléfono y la enviaremos cuando vuelvas a abrir el Coach con internet.</Text>
      </View>
    );
  }
  if (state.kind === 'forbidden') {
    return (
      <View style={styles.bannerColumn} accessibilityRole="alert">
        <View style={styles.bannerRow}>
          <Lock color="#FFD278" size={20} />
          <Text style={styles.bannerText}>Guardar sesiones requiere el plan Pro o Enterprise.</Text>
        </View>
        <AuthButton label="Ver planes" variant="secondary" onPress={onPlans} />
      </View>
    );
  }
  return (
    <View style={styles.bannerColumn} accessibilityRole="alert">
      <Text style={styles.bannerText}>{state.message}</Text>
      <AuthButton label="Reintentar" icon={RotateCw} variant="secondary" onPress={onRetry} />
    </View>
  );
}

function Stat({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value} ${unit}`}>
      <Text style={[styles.statValue, { color }]}>
        {value}
        <Text style={styles.statUnit}> {unit}</Text>
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three, paddingBottom: Spacing.five },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three },
  title: { color: Brand.text, fontSize: 26, fontWeight: '800', flexShrink: 1 },
  subtitle: { color: Brand.textSecondary, fontSize: 15 },
  body: { color: Brand.textSecondary, fontSize: 15, marginBottom: Spacing.three },
  card: { gap: Spacing.three, padding: Spacing.three, borderRadius: 16, backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: Spacing.three, alignSelf: 'stretch' },
  stat: { width: '50%', alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statUnit: { color: Brand.textSecondary, fontSize: 12, fontWeight: '600' },
  statLabel: { color: Brand.textSecondary, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: 14, backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border },
  bannerGold: { borderColor: '#FFD278' },
  bannerColumn: { gap: Spacing.two, padding: Spacing.three, borderRadius: 14, backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  bannerText: { color: Brand.text, fontSize: 15, flexShrink: 1 },
});
