import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';

type PillTabsProps<T extends string> = {
  options: readonly { key: T; label: string }[];
  selected: T;
  onSelect: (key: T) => void;
  // 'segment': cambia de sección (ancho completo, texto centrado). 'chip': filtra una lista.
  variant?: 'segment' | 'chip';
  // Solo chips: se acomodan en varias filas en lugar de desplazarse
  wrap?: boolean;
  // Con wrap: cada chip ocupa media fila y el último crece a todo el ancho
  fill?: boolean;
  // Muestra el check en el chip seleccionado (por defecto sí)
  check?: boolean;
};

export function PillTabs<T extends string>({ options, selected, onSelect, variant = 'chip', wrap = false, fill = false, check = true }: PillTabsProps<T>) {
  if (variant === 'segment') {
    return (
      <View style={styles.segment} accessibilityRole="tablist">
        {options.map(({ key, label }) => {
          const active = key === selected;
          return (
            <Pressable key={key} onPress={() => onSelect(key)} style={[styles.segmentItem, active && styles.segmentActive]} accessibilityRole="tab" accessibilityState={{ selected: active }}>
              <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }
  if (wrap) {
    return (
      <View style={styles.wrap} accessibilityRole="tablist">
        {options.map(({ key, label }) => {
          const active = key === selected;
          return (
            <Pressable key={key} hitSlop={4} onPress={() => onSelect(key)} style={[styles.pill, fill && styles.fill, active && styles.pillActive]} accessibilityRole="tab" accessibilityState={{ selected: active }}>
              {active && check && <Check size={14} color="#FFB3B7" strokeWidth={2.5} />}
              <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroll}>
      {options.map(({ key, label }) => {
        const active = key === selected;
        return (
          <Pressable key={key} hitSlop={4} onPress={() => onSelect(key)} style={[styles.pill, active && styles.pillActive]} accessibilityRole="tab" accessibilityState={{ selected: active }}>
            {active && <Check size={14} color={Brand.text} strokeWidth={2.5} />}
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', backgroundColor: Brand.surface, borderRadius: 14, borderWidth: 1, borderColor: Brand.border, padding: 4, marginBottom: Spacing.three },
  segmentItem: { flex: 1, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: '#2A2A2E' },
  segmentLabel: { color: Brand.textSecondary, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  segmentLabelActive: { color: Brand.text },
  fill: { flexGrow: 1, flexBasis: '44%' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.three },
  scroll: { flexGrow: 0, flexShrink: 0, marginBottom: Spacing.three },
  row: { gap: Spacing.two },
  pill: { height: 44, flexDirection: 'row', gap: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: Brand.border, alignItems: 'center', justifyContent: 'center' },
  pillActive: { borderColor: Brand.primary, backgroundColor: Brand.primary },
  label: { color: Brand.textSecondary, fontSize: 14, fontWeight: '600' },
  labelActive: { color: Brand.text },
});
