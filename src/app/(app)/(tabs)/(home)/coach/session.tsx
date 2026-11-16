import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Play, SwitchCamera, Volume2, VolumeX } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { CoachNotice } from '@/components/coach/coach-notice';
import { LevelGuide } from '@/components/coach/level-guide';
import { LiveMetrics, scoreColor } from '@/components/coach/live-metrics';
import { PoseCamera } from '@/components/coach/pose-camera';
import { ScreenContainer } from '@/components/common/screen-container';
import { COUNTDOWN_SECONDS, CoachExercises, SESSION_DURATIONS, type CoachExercise } from '@/constants/coach';
import { Brand, Spacing } from '@/constants/theme';
import { useCameraAccess } from '@/hooks/use-camera-access';
import { useCoachAnalysis } from '@/hooks/use-coach-analysis';
import { levelMessage, useDeviceLevel } from '@/hooks/use-device-level';
import { usePoseTracking, type PoseEngineStatus } from '@/hooks/use-pose-tracking';
import { useVoiceCoach } from '@/hooks/use-voice-coach';
import type { CameraFacing } from '@/types/pose';

type Phase = 'preparing' | 'countdown' | 'running' | 'empty';

const STATUS_LABELS: Record<Exclude<PoseEngineStatus, 'error'>, string> = {
  starting: 'Abriendo la cámara…',
  'loading-runtime': 'Descargando MediaPipe (1/2)…',
  'loading-model': 'Cargando el modelo de pose (2/2)…',
  ready: 'Listo',
};

const SPOKEN_COUNT = new Set([3, 2, 1]);

const formatClock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export default function CoachSessionScreen() {
  const params = useLocalSearchParams<{ exercise?: string; duration?: string }>();
  const exercise: CoachExercise = params.exercise === 'shadow' ? 'shadow' : 'stance';
  const requested = Number(params.duration);
  const duration = (SESSION_DURATIONS as readonly number[]).includes(requested) ? requested : SESSION_DURATIONS[0];

  const focused = useIsFocused();
  const { access, request } = useCameraAccess();
  const level = useDeviceLevel(focused);
  const phoneSteady = level.status !== 'ready' || (level.level && level.stable);
  const [phase, setPhase] = useState<Phase>('preparing');
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const analysis = useCoachAnalysis(phase === 'running' && phoneSteady);
  const tracking = usePoseTracking(analysis.onFrame);
  const [facing, setFacing] = useState<CameraFacing>('user');
  const [voiceOn, setVoiceOn] = useState(true);
  const analyzing = tracking.status === 'ready';
  const voiceMessage = phase === 'running' ? (phoneSteady ? analysis.live.tip : levelMessage(level)) : phase === 'preparing' ? levelMessage(level) : null;
  const { voiceStatus, announce } = useVoiceCoach(voiceMessage, voiceOn && analyzing && focused);
  const finished = useRef(false);
  const handledTick = useRef<string | null>(null);

  useEffect(() => {
    if (phase !== 'countdown' && phase !== 'running') return;
    const timer = setInterval(() => setSecondsLeft((left) => left - 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    const tick = `${phase}:${secondsLeft}`;
    if (handledTick.current === tick) return;
    handledTick.current = tick;
    if (phase === 'countdown') {
      if (secondsLeft === COUNTDOWN_SECONDS) announce(`Empezamos en ${COUNTDOWN_SECONDS} segundos. Ponte en posición.`);
      else if (SPOKEN_COUNT.has(secondsLeft)) announce(String(secondsLeft));
      else if (secondsLeft <= 0) {
        announce('¡A jugar!');
        analysis.reset();
        setSecondsLeft(duration);
        setPhase('running');
      }
      return;
    }
    if (phase === 'running' && secondsLeft <= 0 && !finished.current) {
      finished.current = true;
      announce('¡Tiempo! Buen trabajo.');
      const summary = analysis.summary(duration);
      if (!summary) {
        setPhase('empty');
        return;
      }
      router.replace({ pathname: '/coach/summary', params: { data: JSON.stringify({ ...summary, exercise }) } });
    }
  }, [phase, secondsLeft, announce, analysis, duration, exercise]);

  const start = () => {
    finished.current = false;
    setSecondsLeft(COUNTDOWN_SECONDS);
    setPhase('countdown');
  };

  const notice = access === 'prompt' || access === 'blocked' ? access : tracking.status === 'error' ? tracking.error : null;
  const glow = phase === 'running' && phoneSteady && analysis.live.postureScore !== null ? scoreColor(analysis.live.postureScore) : Brand.border;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" hitSlop={12} onPress={() => router.back()}>
          <ChevronLeft color={Brand.text} size={26} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>{CoachExercises[exercise].title}</Text>
      </View>

      <View style={[styles.stage, { borderColor: glow, borderWidth: glow === Brand.border ? 1 : 5 }]}>
        {notice ? (
          <CoachNotice reason={notice} onRetry={access === 'granted' ? tracking.restart : request} />
        ) : access === 'granted' && focused ? (
          <>
            <PoseCamera key={tracking.engineKey} facing={facing} paused={false} onMessage={tracking.handleMessage} onLoadError={tracking.handleLoadError} />

            <View style={styles.topBar}>
              <View style={styles.chip} accessibilityLiveRegion="polite">
                {!analyzing && <ActivityIndicator size="small" color={Brand.cyan} />}
                <Text style={styles.chipText}>
                  {!analyzing ? STATUS_LABELS[tracking.status as Exclude<PoseEngineStatus, 'error'>] : tracking.personDetected ? `Te veo · ${tracking.fps} fps` : 'Aléjate hasta verte entero'}
                </Text>
              </View>
              <View style={styles.actions}>
                <RoundButton
                  label={voiceStatus === 'missing' ? 'Voz en español no disponible' : voiceOn ? 'Silenciar consejos por voz' : 'Activar consejos por voz'}
                  disabled={voiceStatus === 'missing'}
                  onPress={() => setVoiceOn((on) => !on)}>
                  {voiceOn && voiceStatus !== 'missing' ? <Volume2 color={Brand.text} size={22} /> : <VolumeX color={Brand.textSecondary} size={22} />}
                </RoundButton>
                <RoundButton
                  label={facing === 'user' ? 'Usar cámara trasera' : 'Usar cámara frontal'}
                  disabled={phase === 'running'}
                  onPress={() => setFacing((current) => (current === 'user' ? 'environment' : 'user'))}>
                  <SwitchCamera color={Brand.text} size={22} />
                </RoundButton>
              </View>
            </View>

            {analyzing && phase !== 'countdown' && <LevelGuide level={level} />}

            {phase === 'countdown' && (
              <View style={styles.centerOverlay} pointerEvents="none">
                <Text style={styles.countdown} accessibilityLiveRegion="assertive">{Math.max(secondsLeft, 0)}</Text>
                <Text style={styles.countdownHint}>Ponte en posición</Text>
              </View>
            )}

            {phase === 'running' && (
              <>
                <Text style={styles.clock} accessibilityLabel={`Quedan ${secondsLeft} segundos`}>{formatClock(Math.max(secondsLeft, 0))}</Text>
                <LiveMetrics metrics={analysis.live} paused={!phoneSteady} exercise={exercise} />
              </>
            )}

            {phase === 'preparing' && (
              <View style={styles.bottomCard}>
                <Text style={styles.cardText}>
                  {analyzing
                    ? 'Apoya el teléfono vertical a 2–3 m para que se vea tu cuerpo entero. Al pulsar Empezar tendrás 10 segundos para colocarte.'
                    : 'Mientras carga, busca dónde apoyar el teléfono.'}
                </Text>
                {voiceStatus === 'missing' && <Text style={styles.voiceHint}>Tu teléfono no tiene una voz en español. Instálala en Ajustes › Texto a voz para escuchar los consejos.</Text>}
                <AuthButton label={`Empezar · ${formatClock(duration)}`} icon={Play} disabled={!analyzing} onPress={start} />
              </View>
            )}

            {phase === 'empty' && (
              <View style={styles.bottomCard}>
                <Text style={styles.cardText}>No pudimos verte durante la sesión. Revisa que se vea tu cuerpo entero, pies incluidos, y vuelve a intentarlo.</Text>
                <AuthButton label="Intentar de nuevo" icon={Play} onPress={start} />
              </View>
            )}
          </>
        ) : (
          <ActivityIndicator color={Brand.cyan} style={styles.loader} />
        )}
      </View>
    </ScreenContainer>
  );
}

function RoundButton({ label, disabled, onPress, children }: { label: string; disabled?: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      style={({ pressed }) => [styles.round, (pressed || disabled) && styles.dimmed]}
      onPress={onPress}>
      {children}
    </Pressable>
  );
}

const overlay = 'rgba(0,0,0,0.72)';

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginVertical: Spacing.three },
  title: { color: Brand.text, fontSize: 26, fontWeight: '800', flexShrink: 1 },
  stage: { flex: 1, marginBottom: Spacing.three, borderRadius: 16, overflow: 'hidden', backgroundColor: Brand.surface, justifyContent: 'center' },
  topBar: { position: 'absolute', top: Spacing.three, left: Spacing.three, right: Spacing.three, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999, backgroundColor: overlay, flexShrink: 1 },
  chipText: { color: Brand.text, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'], flexShrink: 1 },
  actions: { flexDirection: 'row', gap: Spacing.two },
  round: { width: 48, height: 48, borderRadius: 24, backgroundColor: overlay, alignItems: 'center', justifyContent: 'center' },
  dimmed: { opacity: 0.5 },
  centerOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  countdown: { color: Brand.text, fontSize: 120, fontWeight: '900', fontVariant: ['tabular-nums'] },
  countdownHint: { color: Brand.text, fontSize: 22, fontWeight: '800' },
  clock: { position: 'absolute', top: 120, alignSelf: 'center', color: Brand.text, fontSize: 44, fontWeight: '900', fontVariant: ['tabular-nums'], backgroundColor: overlay, paddingHorizontal: Spacing.three, borderRadius: 16, overflow: 'hidden' },
  bottomCard: { position: 'absolute', left: Spacing.three, right: Spacing.three, bottom: Spacing.three, gap: Spacing.three, padding: Spacing.three, borderRadius: 16, backgroundColor: overlay, borderWidth: 1, borderColor: Brand.border },
  cardText: { color: Brand.text, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  voiceHint: { color: Brand.textSecondary, fontSize: 13, textAlign: 'center' },
  loader: { alignSelf: 'center' },
});
