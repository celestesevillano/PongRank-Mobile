import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { Brand, Spacing } from '@/constants/theme';
import { useRegistration } from '@/context/registration';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { authService } from '@/services/auth.service';
import { ApiError, toApiError } from '@/utils/api-error';
import { INITIAL_LEVELS, type InitialLevel } from '@/utils/levels';

export default function OnboardingRatingScreen() {
  const { signInWithAuthResponse } = useSession();
  const { draft, clearDraft } = useRegistration();
  const { showToast } = useToast();
  const [level, setLevel] = useState<InitialLevel>('INTERMEDIATE');
  const [federated, setFederated] = useState(false);
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!draft?.gender) return;
    const { gender } = draft;
    setSaving(true);
    try {
      const auth = await authService.register({
        ...draft,
        gender,
        initialLevel: level,
        ...(federated ? { federatedDeclared: true, categoryFdptm: category || undefined } : {}),
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
        <Pressable onPress={() => router.back()} hitSlop={12}>
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
        <Text style={styles.subtitle}>Elige el que mejor te describe; tus partidas lo ajustarán</Text>

        <View style={styles.levels}>
          {INITIAL_LEVELS.map((option) => {
            const selected = option.value === level;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[styles.levelCard, selected && styles.levelCardActive]}
                onPress={() => setLevel(option.value)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.levelLabel}>{option.label}</Text>
                  <Text style={styles.levelHint}>{option.hint}</Text>
                </View>
                <Text style={styles.levelRating}>{option.rating}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.federatedRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.federatedTitle}>¿Eres jugador federado (FDPTM)?</Text>
            <Text style={styles.federatedHint}>Activa esta opción si tienes categoría y puntos en el ranking nacional.</Text>
          </View>
          <Switch
            value={federated}
            onValueChange={setFederated}
            trackColor={{ true: Brand.red, false: Brand.border }}
          />
        </View>

        {federated && (
          <AuthInput placeholder="Categoría FDPTM" value={category} onChangeText={setCategory} />
        )}

        <AuthButton label="Completar configuración" loading={saving} onPress={handleContinue} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, gap: Spacing.three },
  back: { color: Brand.text, fontSize: 28 },
  progressRow: { gap: Spacing.one, marginBottom: Spacing.two },
  progressLabel: { color: Brand.textSecondary, fontSize: 12, textAlign: 'center' },
  progressTrack: { flexDirection: 'row', gap: 4 },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: Brand.red },
  progressFillEmpty: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Brand.border },
  icon: { width: 48, height: 48, alignSelf: 'center' },
  wordmark: { width: 140, height: 28, alignSelf: 'center' },
  title: { color: Brand.text, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: Spacing.two },
  subtitle: { color: Brand.textSecondary, textAlign: 'center', fontSize: 13 },
  levels: { gap: Spacing.two },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  levelCardActive: { borderColor: Brand.red, backgroundColor: 'rgba(232, 38, 47, 0.15)' },
  levelLabel: { color: Brand.text, fontSize: 15, fontWeight: '700' },
  levelHint: { color: Brand.textSecondary, fontSize: 12 },
  levelRating: { color: Brand.red, fontSize: 14, fontWeight: '700' },
  federatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  federatedTitle: { color: Brand.text, fontSize: 14, fontWeight: '600' },
  federatedHint: { color: Brand.textSecondary, fontSize: 11, marginTop: 2 },
});
