import { Smartphone } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';
import { levelMessage, type DeviceLevel } from '@/hooks/use-device-level';

export function LevelGuide({ level }: { level: DeviceLevel }) {
  const message = levelMessage(level);
  if (!message) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Smartphone color="#FFD278" size={18} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { position: 'absolute', top: 64, left: Spacing.three, right: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.72)', borderWidth: 1, borderColor: '#FFD278' },
  text: { color: Brand.text, fontSize: 17, fontWeight: '700', flexShrink: 1 },
});
