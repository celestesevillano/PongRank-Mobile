import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { playersService } from '@/services/players.service';

const MIN_RATING = 1;
const MAX_RATING = 2800;

const PRESETS = [
  { label: 'Nunca jugué', value: 800 },
  { label: 'Nivel intermedio', value: 1500 },
  { label: 'Nivel avanzado', value: 2000 },
];

export default function OnboardingRatingScreen() {
  const { player, updateLocalPlayer } = useSession();
  const [rating, setRating] = useState(1500);
  const [federated, setFederated] = useState(false);
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    // Nota: el rating inicial es solo referencial en esta pantalla — el backend
    // calcula el Glicko-2 real a partir de los partidos jugados, no hay un endpoint
    // para fijarlo manualmente. Sí persistimos la declaración de federado.
    if (player && federated) {
      setSaving(true);
      try {
        const updated = await playersService.update(player.id, {
          federatedDeclared: true,
          categoryFdptm: category || undefined,
        });
        updateLocalPlayer(updated);
      } catch {
        // si falla, no bloqueamos el onboarding por esto
      } finally {
        setSaving(false);
      }
    }
    router.push('/(auth)/onboarding-community');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Paso 2 de 3</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFillEmpty} />
            <View style={[styles.progressFill, { flex: 1 }]} />
            <View style={styles.progressFillEmpty} />
          </View>
        </View>

        <Image source={require('@/assets/images/pongrank-paddle.png')} style={styles.icon} contentFit="contain" />
        <Image source={require('@/assets/images/pongrank-wordmark.png')} style={styles.wordmark} contentFit="contain" />

        <Text style={styles.title}>Tu rating inicial</Text>
        <Text style={styles.subtitle}>Desliza para indicar tu nivel actual</Text>

        <View style={styles.ratingCard}>
          <TextInput
            style={styles.ratingValue}
            keyboardType="number-pad"
            maxLength={4}
            value={String(Math.round(rating))}
            onChangeText={(text) => {
              const parsed = parseInt(text.replace(/\D/g, ''), 10);
              setRating(Number.isNaN(parsed) ? MIN_RATING : Math.min(parsed, MAX_RATING));
            }}
            onBlur={() => setRating((value) => Math.max(value, MIN_RATING))}
          />
          <Text style={styles.ratingHint}>Toca para editar</Text>
          <View style={styles.presetRow}>
            {PRESETS.map((p) => (
              <Pressable
                key={p.label}
                style={[styles.presetChip, Math.round(rating) === p.value && styles.presetChipActive]}
                onPress={() => setRating(p.value)}
              >
                <Text
                  style={[styles.presetChipLabel, Math.round(rating) === p.value && styles.presetChipLabelActive]}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Slider
          minimumValue={MIN_RATING}
          maximumValue={MAX_RATING}
          step={10}
          value={rating}
          onValueChange={setRating}
          minimumTrackTintColor={Brand.red}
          maximumTrackTintColor={Brand.border}
          thumbTintColor={Brand.red}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>Nunca jugué</Text>
          <Text style={styles.sliderLabel}>Avanzado</Text>
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
  ratingCard: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  ratingValue: { color: Brand.red, fontSize: 56, fontWeight: '800', textAlign: 'center', minWidth: 140 },
  ratingHint: { color: Brand.textSecondary, fontSize: 12 },
  presetRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap', justifyContent: 'center' },
  presetChip: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  presetChipActive: { backgroundColor: Brand.red, borderColor: Brand.red },
  presetChipLabel: { color: Brand.textSecondary, fontSize: 12 },
  presetChipLabelActive: { color: '#FFFFFF', fontWeight: '700' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -Spacing.two },
  sliderLabel: { color: Brand.textSecondary, fontSize: 11 },
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
