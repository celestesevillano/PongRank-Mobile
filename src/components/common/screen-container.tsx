import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Spacing } from '@/constants/theme';

export function ScreenContainer({ title, titleStyle, children }: PropsWithChildren<{ title?: string; titleStyle?: StyleProp<TextStyle> }>) {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {title ? <Text accessibilityRole="header" style={[styles.title, titleStyle]}>{title}</Text> : null}
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  safeArea: { flex: 1, paddingHorizontal: Spacing.three },
  title: { color: Brand.text, fontSize: 26, fontWeight: '800', marginVertical: Spacing.three },
});
