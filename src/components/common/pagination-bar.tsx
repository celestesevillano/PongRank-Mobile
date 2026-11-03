import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';
import type { Page } from '@/types/api';
import { pageRange } from '@/utils/pagination';

type PaginationBarProps = {
  page: Page<unknown>;
  onPageChange: (page: number) => void;
};

export function PaginationBar({ page, onPageChange }: PaginationBarProps) {
  const { from, to } = pageRange(page);

  return (
    <View style={styles.container}>
      <PagerButton label="‹ Anterior" disabled={page.first} onPress={() => onPageChange(page.page - 1)} />
      <Text style={styles.summary}>
        {from}–{to} de {page.totalElements}
      </Text>
      <PagerButton label="Siguiente ›" disabled={page.last} onPress={() => onPageChange(page.page + 1)} />
    </View>
  );
}

function PagerButton({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.button, disabled && styles.disabled]}>
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.three },
  summary: { color: Brand.textSecondary, fontSize: 13 },
  button: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: Spacing.two, backgroundColor: Brand.surface },
  disabled: { opacity: 0.35 },
  buttonLabel: { color: Brand.text, fontSize: 14, fontWeight: '600' },
});
