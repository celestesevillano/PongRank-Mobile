import { ArrowLeft } from 'lucide-react-native';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '@/components/common/screen-container';
import { Brand, Spacing } from '@/constants/theme';

export function CommunityScreen({ title, onBack, children }: PropsWithChildren<{ title: string; onBack: () => void }>) {
  return (
    <ScreenContainer title={title}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
        <ArrowLeft color={Brand.textSecondary} size={20} />
        <Text style={styles.label}>Volver</Text>
      </Pressable>
      {children}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 44, alignSelf: 'flex-start' },
  label: { color: Brand.textSecondary, fontWeight: '600' },
});
