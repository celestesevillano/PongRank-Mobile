import { Medal } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

const medals = [
  { color: '#FFD278', backgroundColor: '#3D3018' },
  { color: '#D0D7E2', backgroundColor: '#292D35' },
  { color: '#F0AF86', backgroundColor: '#39261E' },
];

export function RankingPosition({ position }: { position: number }) {
  const medal = medals[position - 1];
  const color = medal?.color ?? Brand.textSecondary;

  return (
    <View style={[styles.position, medal && { backgroundColor: medal.backgroundColor }]}>
      {medal && <Medal size={14} color={color} />}
      <Text accessibilityLabel={`Puesto ${position}`} style={[styles.number, { color }]}>{position}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  position: { minWidth: 44, minHeight: 26, paddingHorizontal: 4, borderRadius: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  number: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
