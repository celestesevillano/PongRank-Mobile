import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';

// Único formato de «Volver» de toda la app: flecha a la izquierda y texto gris, sin borde.
export function BackButton({ onPress, disabled, accessibilityLabel }: { onPress: () => void; disabled?: boolean; accessibilityLabel?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? 'Volver'} disabled={disabled} hitSlop={8}
      onPress={onPress} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
      <ArrowLeft color={Brand.textSecondary} size={20} />
      <Text style={styles.label}>Volver</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 44, alignSelf: 'flex-start' },
  pressed: { opacity: 0.7 },
  label: { color: Brand.textSecondary, fontWeight: '600' },
});
