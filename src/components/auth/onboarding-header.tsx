import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/common/back-button';
import { Brand, Spacing } from '@/constants/theme';

const TOTAL_STEPS = 4;

// Encabezado común de los cuatro pasos del registro: volver, progreso, marca y título.
export function OnboardingHeader({ step, title, backDisabled }: { step: number; title: string; backDisabled?: boolean }) {
  return (
    <View style={styles.header}>
      <BackButton disabled={backDisabled} onPress={() => router.back()} />
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>Paso {step} de {TOTAL_STEPS}</Text>
        <View style={styles.progressTrack}>
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <View key={index} style={index < step ? styles.progressFill : styles.progressFillEmpty} />
          ))}
        </View>
      </View>
      <Image source={require('@/assets/images/pongrank-paddle.png')} style={styles.icon} contentFit="contain" accessibilityElementsHidden />
      <Image source={require('@/assets/images/pongrank-wordmark.png')} style={styles.wordmark} contentFit="contain" accessibilityElementsHidden />
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.three },
  back: { color: Brand.text, fontSize: 28 },
  progressRow: { gap: Spacing.one },
  progressLabel: { color: Brand.textSecondary, fontSize: 12, textAlign: 'center' },
  progressTrack: { flexDirection: 'row', gap: 4 },
  progressFill: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Brand.red },
  progressFillEmpty: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Brand.border },
  icon: { width: 56, height: 56, alignSelf: 'center' },
  wordmark: { width: 160, height: 32, alignSelf: 'center' },
  title: { color: Brand.text, fontSize: 26, fontWeight: '700', textAlign: 'center' },
});
