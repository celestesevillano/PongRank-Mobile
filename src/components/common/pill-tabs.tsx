import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';

type PillTabsProps<T extends string> = {
  options: readonly { key: T; label: string }[];
  selected: T;
  onSelect: (key: T) => void;
};

// Segmentos en forma de píldora (Social: Comunidades, Clubes, Amigos)
export function PillTabs<T extends string>({ options, selected, onSelect }: PillTabsProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroll}>
      {options.map(({ key, label }) => {
        const active = key === selected;
        return (
          <Pressable key={key} onPress={() => onSelect(key)} style={[styles.pill, active && styles.pillActive]} accessibilityRole="tab" accessibilityState={{ selected: active }}>
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, marginBottom: Spacing.three },
  row: { gap: Spacing.two },
  pill: { height: 36, paddingHorizontal: Spacing.three, borderRadius: 18, borderWidth: 1, borderColor: Brand.border, justifyContent: 'center' },
  pillActive: { borderColor: Brand.red, backgroundColor: 'rgba(216,30,40,0.14)' },
  label: { color: '#B8BAC0', fontSize: 13, fontWeight: '600' },
  labelActive: { color: '#FF4A52' },
});
