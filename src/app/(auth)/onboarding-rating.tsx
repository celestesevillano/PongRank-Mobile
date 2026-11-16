import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { Brand, Spacing } from '@/constants/theme';
import { useRegistration } from '@/context/registration';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { authService } from '@/services/auth.service';
import { playersService } from '@/services/players.service';
import { ApiError, toApiError } from '@/utils/api-error';
import { INITIAL_LEVELS, type InitialLevel } from '@/utils/levels';

export default function OnboardingRatingScreen() {
  const { signInWithAuthResponse } = useSession();
  const { draft, clearDraft } = useRegistration();
  const { showToast } = useToast();
  const [levelIndex, setLevelIndex] = useState(2);
  const selected = INITIAL_LEVELS[levelIndex];
  const level: InitialLevel = selected.value;
  const canDeclareFederation = level === 'ADVANCED' || level === 'EXPERT';
  const [federated, setFederated] = useState(false);
  const [saving, setSaving] = useState(false);
  const birthDate = draft?.birthDate;
  const gender = draft?.gender;
  const canSuggest = Boolean(birthDate && gender && gender !== 'PREFER_NOT_TO_SAY');
  const wantsFederation = canDeclareFederation && federated;
  const suggestion = useFetch(async (signal) => {
    if (!wantsFederation || !birthDate || !gender || gender === 'PREFER_NOT_TO_SAY') return null;
    const category = await playersService.suggestFdptmCategory(birthDate, gender, signal);
    return { birthDate, gender, category };
  }, [wantsFederation, birthDate, gender]);
  const result = suggestion.data;
  const category = !suggestion.loading && !suggestion.error && result
    && result.birthDate === birthDate && result.gender === gender
    ? result.category
    : undefined;

  const handleLevelChange = (value: number) => {
    const nextIndex = Math.round(value);
    const nextLevel = INITIAL_LEVELS[nextIndex].value;
    setLevelIndex(nextIndex);
    if (nextLevel !== 'ADVANCED' && nextLevel !== 'EXPERT') {
      setFederated(false);
    }
  };

  const handleContinue = async () => {
    if (!draft?.gender || saving || (wantsFederation && !category)) return;
    const { gender } = draft;
    setSaving(true);
    try {
      const auth = await authService.register({
        ...draft,
        gender,
        initialLevel: level,
        ...(wantsFederation && category
          ? { federatedDeclared: true, categoryFdptm: category }
          : {}),
      });
      await signInWithAuthResponse(auth);
      clearDraft();
      router.push('/(auth)/onboarding-community');
    } catch (err) {
      const message = err instanceof ApiError && err.status === 409 ? 'Ese correo ya tiene una cuenta. Inicia sesión.' : toApiError(err).message;
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!draft) {
    return <Redirect href="/(auth)/register" />;
  }
  if (!draft.gender) {
    return <Redirect href="/(auth)/about-you" />;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable disabled={saving} onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>{'‹'}</Text>
          </Pressable>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Paso 3 de 4</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { flex: 1 }]} />
              <View style={[styles.progressFill, { flex: 1 }]} />
              <View style={[styles.progressFill, { flex: 1 }]} />
              <View style={styles.progressFillEmpty} />
            </View>
          </View>

          <Image source={require('@/assets/images/pongrank-paddle.png')} style={styles.icon} contentFit="contain" />
          <Image source={require('@/assets/images/pongrank-wordmark.png')} style={styles.wordmark} contentFit="contain" />

          <Text style={styles.title}>Tu nivel inicial</Text>
          <Text style={styles.subtitle}>Desliza hasta el nivel que más se parece a ti</Text>

          <View style={styles.levelCard}>
            <Text style={styles.levelCaption}>TU NIVEL</Text>
            <Text style={styles.levelName}>{selected.label}</Text>
            <Text style={styles.levelHint}>{selected.hint}</Text>
          </View>

          <View>
            <Slider
              accessibilityLabel="Nivel inicial"
              minimumValue={0}
              maximumValue={INITIAL_LEVELS.length - 1}
              step={1}
              disabled={saving}
              value={levelIndex}
              onValueChange={handleLevelChange}
              minimumTrackTintColor={Brand.red}
              maximumTrackTintColor={Brand.border}
              thumbTintColor="#FFFFFF"
            />
            <View style={styles.ticks}>
              {INITIAL_LEVELS.map((option, index) => (
                <View key={option.value} style={[styles.tick, index === levelIndex && styles.tickActive]} />
              ))}
            </View>
            <View style={styles.levelLabels}>
              <Text style={styles.levelLabel}>{INITIAL_LEVELS[0].label}</Text>
              <Text style={[styles.levelLabel, styles.levelLabelActive]}>{selected.label}</Text>
              <Text style={styles.levelLabel}>{INITIAL_LEVELS[INITIAL_LEVELS.length - 1].label}</Text>
            </View>
          </View>

          {canDeclareFederation && (
            <>
              <View style={styles.federatedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.federatedTitle}>¿Eres jugador federado (FDPTM)?</Text>
                  <Text style={styles.federatedHint}>Activa esta opción si figuras en el ranking nacional.</Text>
                </View>
                <Switch
                  accessibilityLabel="Declarar que soy jugador federado"
                  disabled={saving}
                  value={federated}
                  onValueChange={setFederated}
                  trackColor={{ true: Brand.red, false: Brand.border }}
                />
              </View>
              {federated && (
                <View style={styles.federatedDetails}>
                  <Text style={styles.federatedTitle}>Categoría FDPTM</Text>
                  {category ? (
                    <>
                      <Text style={styles.category}>{category}</Text>
                      <Text style={styles.federatedHint}>
                        Sugerida según tu sexo y año de nacimiento. La declaración requiere verificación.
                      </Text>
                    </>
                  ) : !canSuggest ? (
                    <Text style={styles.federatedHint}>
                      Para sugerir una categoría necesitamos el sexo y el año de nacimiento.
                      Puedes volver a tus datos o continuar sin declarar.
                    </Text>
                  ) : suggestion.error || (!suggestion.loading && result?.category === '') ? (
                    <>
                      <Text style={styles.federatedHint}>No pudimos obtener tu categoría. Puedes reintentar o continuar sin declarar.</Text>
                      <AuthButton label="Reintentar" variant="ghost" onPress={suggestion.refetch} />
                    </>
                  ) : (
                    <Text style={styles.federatedHint} accessibilityLiveRegion="polite">Consultando tu categoría…</Text>
                  )}
                </View>
              )}
            </>
          )}

          <AuthButton
            label="Completar configuración"
            loading={saving}
            disabled={wantsFederation && !category}
            onPress={handleContinue}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.three, gap: Spacing.three },
  back: { color: Brand.text, fontSize: 28 },
  progressRow: { gap: Spacing.one, marginBottom: Spacing.two },
  progressLabel: { color: Brand.textSecondary, fontSize: 12, textAlign: 'center' },
  progressTrack: { flexDirection: 'row', gap: 4 },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: Brand.red },
  progressFillEmpty: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Brand.border },
  icon: { width: 48, height: 48, alignSelf: 'center' },
  wordmark: { width: 140, height: 28, alignSelf: 'center' },
  title: { color: Brand.text, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: Spacing.two },
  subtitle: { color: Brand.textSecondary, textAlign: 'center', fontSize: 14 },
  levelCard: {
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1.5,
    borderColor: Brand.red,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(232, 38, 47, 0.10)',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  levelCaption: { color: Brand.textSecondary, fontSize: 13, letterSpacing: 1.5, fontWeight: '700' },
  levelName: { color: Brand.red, fontSize: 36, fontWeight: '800' },
  levelHint: { color: Brand.textSecondary, fontSize: 14 },
  ticks: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, marginTop: -4 },
  tick: { width: 6, height: 6, borderRadius: 3, backgroundColor: Brand.border },
  tickActive: { width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.red },
  levelLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.two },
  levelLabel: { color: Brand.textSecondary, fontSize: 13 },
  levelLabelActive: { color: Brand.red, fontWeight: '700' },
  federatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  federatedDetails: { gap: Spacing.one },
  category: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  federatedTitle: { color: Brand.text, fontSize: 14, fontWeight: '600' },
  federatedHint: { color: Brand.textSecondary, fontSize: 11, marginTop: 2 },
});
