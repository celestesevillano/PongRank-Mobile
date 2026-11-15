import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Spacing } from '@/constants/theme';

export function ScreenContainer({ title, titleStyle, scrollable, children }: PropsWithChildren<{
  title?: string;
  titleStyle?: StyleProp<TextStyle>;
  scrollable?: boolean;
}>) {
  const content = (
    <>
      {title ? <Text accessibilityRole="header" style={[styles.title, titleStyle]}>{title}</Text> : null}
      {children}
    </>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {scrollable ? <ScrollView>{content}</ScrollView> : content}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  safeArea: { flex: 1, paddingHorizontal: Spacing.three },
  title: { color: Brand.text, fontSize: 26, fontWeight: '800', marginVertical: Spacing.three },
});
