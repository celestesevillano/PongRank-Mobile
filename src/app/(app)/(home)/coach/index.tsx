import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronRight, CloudUpload, History, Play, Trophy } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { PillTabs } from '@/components/common/pill-tabs';
import { ScreenContainer } from '@/components/common/screen-container';
import { CoachExercises, SESSION_DURATIONS, type CoachExercise } from '@/constants/coach';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { trainingService } from '@/services/training.service';
import { trainingQueue } from '@/services/training-queue';
import { toApiError } from '@/utils/api-error';

const coachArt = require('../../../../../assets/images/pongrank-home-coach.webp');

const EXERCISE_OPTIONS = (Object.keys(CoachExercises) as CoachExercise[]).map((key) => ({ key, label: CoachExercises[key].title }));
const DURATION_OPTIONS = SESSION_DURATIONS.map((seconds) => ({ key: String(seconds), label: seconds < 60 ? `${seconds} s` : `${seconds / 60} min` }));

const PLACEMENT_TIPS = [
  'Apoya el teléfono vertical en la mesa, una silla o un trípode.',
  'Aléjate 2–3 m para que se vea tu cuerpo entero, pies incluidos.',
  'Busca buena luz y un fondo sin otras personas.',
  'Sube el volumen: Pongi te corregirá en voz alta.',
];

export default function CoachIntroScreen() {
  const { player } = useSession();
  const playerId = player?.id ?? 0;
  const [exercise, setExercise] = useState<CoachExercise>('stance');
  const [duration, setDuration] = useState<string>(String(SESSION_DURATIONS[0]));
  const [pending, setPending] = useState(0);
  const [syncedNow, setSyncedNow] = useState(0);

  const best = useFetch(async (signal) => {
    try {
      return await trainingService.best(playerId, signal);
    } catch (error) {
      if (toApiError(error).status === 404) return null;
      throw error;
    }
  }, [playerId, syncedNow]);

  useFocusEffect(
    useCallback(() => {
      if (!playerId) return;
      let active = true;
      trainingQueue
        .flush(playerId)
        .then(({ sent, remaining }) => {
          if (!active) return;
          setPending(remaining);
          if (sent.length > 0) setSyncedNow((count) => count + sent.length);
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, [playerId]),
  );

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" hitSlop={12} onPress={() => router.back()}>
            <ChevronLeft color={Brand.text} size={26} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>Coach</Text>
        </View>

        <View style={styles.hero}>
          <Image source={coachArt} style={styles.heroArt} contentFit="contain" accessibilityLabel="Pongi, tu coach" />
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Entrena tu técnica sin pelota</Text>
            <Text style={styles.heroBody}>Pongi analiza tu postura y tus golpes con la cámara. El video no sale de tu teléfono.</Text>
          </View>
        </View>

        {pending > 0 && (
          <View style={styles.notice} accessibilityRole="alert">
            <CloudUpload color={Brand.cyan} size={18} />
            <Text style={styles.noticeText}>
              {pending === 1 ? 'Tienes 1 sesión guardada en el teléfono' : `Tienes ${pending} sesiones guardadas en el teléfono`}. Se enviarán cuando haya conexión.
            </Text>
          </View>
        )}
        {syncedNow > 0 && pending === 0 && (
          <View style={styles.notice} accessibilityLiveRegion="polite">
            <CloudUpload color="#2ECC71" size={18} />
            <Text style={styles.noticeText}>Enviamos a tu historial las sesiones que estaban pendientes.</Text>
          </View>
        )}

        <Text style={styles.section}>Ejercicio</Text>
        <PillTabs variant="segment" options={EXERCISE_OPTIONS} selected={exercise} onSelect={setExercise} />
        <Text style={styles.description}>{CoachExercises[exercise].description}</Text>

        <Text style={styles.section}>Duración</Text>
        <PillTabs options={DURATION_OPTIONS} selected={duration} onSelect={setDuration} />

        <Text style={styles.section}>Antes de empezar</Text>
        <View style={styles.tips}>
          {PLACEMENT_TIPS.map((tip, index) => (
            <Text key={tip} style={styles.tip}>
              <Text style={styles.tipNumber}>{index + 1}. </Text>
              {tip}
            </Text>
          ))}
        </View>

        <AuthButton label="Preparar sesión" icon={Play} onPress={() => router.push({ pathname: '/coach/session', params: { exercise, duration } })} />

        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.bestCard, pressed && styles.pressed]} onPress={() => router.push('/coach/history')}>
          <View style={styles.bestIcon}>{best.data ? <Trophy color="#FFD278" size={20} /> : <History color={Brand.cyan} size={20} />}</View>
          <View style={styles.bestText}>
            <Text style={styles.bestTitle}>{best.data ? 'Tu mejor sesión' : 'Tu historial'}</Text>
            <Text style={styles.bestBody}>
              {best.loading && !best.data
                ? 'Cargando…'
                : best.error
                  ? 'No pudimos cargar tu récord. Toca para ver el historial.'
                  : best.data
                    ? `Postura ${Math.round(best.data.postureScore)}/100 · Swing ${best.data.swingVelocityMax.toFixed(1)} m/s`
                    : 'Aún no tienes sesiones. ¡La primera marcará tu récord!'}
            </Text>
          </View>
          <ChevronRight color={Brand.textSecondary} size={20} />
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three, paddingBottom: Spacing.five },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three },
  title: { color: Brand.text, fontSize: 26, fontWeight: '800' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: 16, backgroundColor: '#241419', borderWidth: 1, borderColor: '#71333C' },
  heroArt: { width: 96, height: 96 },
  heroText: { flex: 1, gap: Spacing.one },
  heroTitle: { color: Brand.text, fontSize: 18, fontWeight: '800' },
  heroBody: { color: Brand.textSecondary, fontSize: 14, lineHeight: 20 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: 14, backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border },
  noticeText: { color: Brand.text, fontSize: 14, flexShrink: 1 },
  section: { color: Brand.text, fontSize: 18, fontWeight: '800', marginTop: Spacing.two },
  description: { color: Brand.textSecondary, fontSize: 15, lineHeight: 21 },
  tips: { gap: Spacing.two },
  tip: { color: Brand.textSecondary, fontSize: 15, lineHeight: 21 },
  tipNumber: { color: Brand.cyan, fontWeight: '800' },
  bestCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: 16, backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border },
  bestIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Brand.background, alignItems: 'center', justifyContent: 'center' },
  bestText: { flex: 1, gap: 2 },
  bestTitle: { color: Brand.text, fontSize: 16, fontWeight: '800' },
  bestBody: { color: Brand.textSecondary, fontSize: 14 },
  pressed: { opacity: 0.7 },
});
