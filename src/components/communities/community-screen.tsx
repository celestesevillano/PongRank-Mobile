import { ArrowLeft } from 'lucide-react-native';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/common/screen-container';
import { Brand, Spacing } from '@/constants/theme';

export function CommunityScreen({ title, onBack, action, children }: PropsWithChildren<{ title: string; onBack: () => void; action?: ReactNode }>) {
  return (
    <ScreenContainer title={title}>
      <View style={styles.toolbar}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
          <ArrowLeft color={Brand.textSecondary} size={20} />
          <Text style={styles.label}>Volver</Text>
        </Pressable>
        {action}
      </View>
      {children}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 44, alignSelf: 'flex-start' },
  label: { color: Brand.textSecondary, fontWeight: '600' },
});
