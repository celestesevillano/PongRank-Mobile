import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Brand, Spacing } from '@/constants/theme';
import type { CommunityResponse } from '@/types/api';

const TYPE_LABEL: Record<CommunityResponse['communityType'], string> = {
  UNIVERSITY: 'Universidad',
  SCHOOL: 'Colegio',
  PUBLIC_PARK: 'Parque',
  OTHER: 'Comunidad',
};

export function CommunityCard({ community, onPress, featured = false }: { community: CommunityResponse; onPress?: () => void; featured?: boolean }) {
  const initials = community.name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toLocaleUpperCase('es');
  const mark = <Text style={styles.mark}>{initials}</Text>;
  const content = (
    <>
      {featured && (
        <View style={styles.cover}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs><LinearGradient id="cover" x1="0%" y1="0%" x2="100%" y2="70%"><Stop offset="0" stopColor={Brand.surface} /><Stop offset="1" stopColor="#22D3EE" /></LinearGradient></Defs>
            <Rect width="100%" height="100%" fill="url(#cover)" />
          </Svg>
          {mark}
        </View>
      )}
      <View style={styles.row}>
        {!featured && mark}
        <View style={styles.label}>
          <Text style={styles.name}>{community.name}</Text>
          <Text style={styles.meta}>{community.memberCount} {community.memberCount === 1 ? 'miembro' : 'miembros'} · {TYPE_LABEL[community.communityType]}</Text>
        </View>
        {onPress && <ChevronRight color={Brand.textSecondary} size={20} />}
      </View>
    </>
  );

  return onPress
    ? <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>{content}</Pressable>
    : <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: Spacing.three, overflow: 'hidden' },
  cover: { height: 84, padding: Spacing.three, justifyContent: 'flex-end' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  mark: { backgroundColor: '#222226', color: '#22D3EE', minWidth: 42, padding: 10, textAlign: 'center', borderRadius: 10, fontWeight: '800', overflow: 'hidden', alignSelf: 'flex-start' },
  label: { flex: 1, gap: Spacing.one },
  name: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  meta: { color: Brand.textSecondary, fontSize: 13 },
});
