import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Polygon, Rect, Stop } from 'react-native-svg';

import { Brand, Spacing } from '@/constants/theme';

export function ClubCard({ name, description, featured, onPress }: {
  name: string;
  description: string;
  featured?: boolean;
  onPress?: () => void;
}) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toLocaleUpperCase('es');
  const content = (
    <>
      {featured && (
        <View style={styles.cover}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs><LinearGradient id="clubCover" x1="0%" y1="0%" x2="100%" y2="85%"><Stop offset="0" stopColor={Brand.surface} /><Stop offset="1" stopColor="#751C25" /></LinearGradient></Defs>
            <Rect width="100%" height="100%" fill="url(#clubCover)" />
          </Svg>
          <View style={styles.crest}>
            <Svg width={64} height={72} viewBox="0 0 64 72" style={StyleSheet.absoluteFill}>
              <Polygon points="1,1 63,1 63,47 32,71 1,47" fill={Brand.surface} stroke="#FF4A52" strokeWidth={2} />
            </Svg>
            <Text style={styles.crestText}>{initials}</Text>
          </View>
        </View>
      )}
      <View style={styles.row}>
        {!featured && <Text style={styles.mark}>{initials}</Text>}
        <View style={styles.info}>
          <Text style={[styles.name, featured && styles.featuredName]}>{name}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        {onPress && <ChevronRight size={18} color={Brand.textSecondary} />}
      </View>
    </>
  );

  return onPress
    ? <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>{content}</Pressable>
    : <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  cover: { height: 112, justifyContent: 'center', paddingHorizontal: Spacing.three },
  crest: { width: 64, height: 72, alignItems: 'center', justifyContent: 'center', paddingBottom: 10 },
  crestText: { color: Brand.text, fontSize: 24, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  mark: { minWidth: 42, textAlign: 'center', padding: 10, borderRadius: 8, backgroundColor: '#30171B', color: '#FF8085', fontWeight: '800', overflow: 'hidden' },
  info: { flex: 1, gap: 4 },
  name: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  featuredName: { fontSize: 24 },
  description: { color: Brand.textSecondary, fontSize: 14 },
});
