import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Spacing } from '@/constants/theme';

export type SelectOption<T extends string | number> = { value: T; label: string };

type SelectFieldProps<T extends string | number> = {
  label: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
};

export function SelectField<T extends string | number>({ label, value, options, onChange }: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? 'sin elegir'}`}
        style={styles.field}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ?? 'Elegir'}
        </Text>
        <ChevronDown color={Brand.textSecondary} size={18} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Cerrar" />
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <FlatList
            data={options}
            keyExtractor={(option) => String(option.value)}
            initialNumToRender={20}
            renderItem={({ item }) => {
              const active = item.value === value;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{item.label}</Text>
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, gap: Spacing.one },
  label: { color: Brand.textSecondary, fontSize: 13 },
  field: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    backgroundColor: Brand.surface,
  },
  value: { flex: 1, color: Brand.text, fontSize: 16 },
  placeholder: { color: Brand.textSecondary },
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  sheet: {
    maxHeight: '55%',
    backgroundColor: Brand.surface,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingTop: Spacing.three,
  },
  sheetTitle: { color: Brand.text, fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.two },
  option: { minHeight: 48, justifyContent: 'center', paddingHorizontal: Spacing.four },
  optionActive: { backgroundColor: 'rgba(232, 38, 47, 0.15)' },
  optionLabel: { color: Brand.text, fontSize: 16 },
  optionLabelActive: { color: Brand.red, fontWeight: '700' },
});
