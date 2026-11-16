import { Info } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';

export function ClubNotice({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.card}>
      <Info size={19} color="#22D3EE" />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, padding: 12,
    backgroundColor: Brand.surface, borderWidth: 1, borderColor: '#2D7782', borderRadius: 14 },
  copy: { flex: 1, gap: 3 },
  title: { color: Brand.text, fontWeight: '700', lineHeight: 19 },
  message: { color: Brand.textSecondary, fontSize: 13, lineHeight: 18 },
});
