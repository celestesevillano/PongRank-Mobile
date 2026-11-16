import { router, type Href } from 'expo-router';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';

export function ProfileScreen({ title, back, footer, action, children }: PropsWithChildren<{
  title: string; back?: { label: string; route: Href }; footer?: ReactNode; action?: ReactNode;
}>) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.frame}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Volver a ${back.label}`}
              onPress={() => router.canGoBack() ? router.back() : router.replace(back.route)}
              style={styles.back}>
              <ChevronLeft color={Brand.textSecondary} size={19} />
              <Text style={styles.secondary}>{back.label}</Text>
            </Pressable>
          ) : null}
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.heading}>{title}</Text>
            {action}
          </View>
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </SafeAreaView>
  );
}

export function ProfileRow({ Icon, label, detail, value, onPress }: {
  Icon: LucideIcon; label: string; detail?: string; value?: string; onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.icon}><Icon color={Brand.cyan} size={19} /></View>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {detail ? <Text style={styles.secondary}>{detail}</Text> : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      <ChevronRight color={Brand.textSecondary} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.background },
  frame: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  content: { padding: Spacing.three, gap: Spacing.three },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: -Spacing.two },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, minHeight: 44 },
  heading: { color: Brand.text, fontSize: 30, fontWeight: '800', flexShrink: 1 },
  secondary: { color: Brand.textSecondary, fontSize: 13 },
  label: { color: Brand.text, fontWeight: '700', fontSize: 15 },
  value: { color: Brand.cyan, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderColor: Brand.border, borderRadius: 14, backgroundColor: Brand.surface },
  icon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#102730', alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 3 },
  pressed: { opacity: 0.75 },
  footer: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.three, backgroundColor: Brand.background },
});
