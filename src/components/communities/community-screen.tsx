import { ArrowLeft } from 'lucide-react-native';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/common/back-button';
import { ScreenContainer } from '@/components/common/screen-container';
import { Brand, Spacing } from '@/constants/theme';

export function CommunityScreen({ title, onBack, action, scrollable, children }: PropsWithChildren<{ title: string; onBack: () => void; action?: ReactNode; scrollable?: boolean }>) {
  return (
    <ScreenContainer title={title} scrollable={scrollable}>
      <View style={styles.toolbar}>
        <BackButton onPress={onBack} />
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
