import { StyleSheet, Text } from 'react-native';

import { Brand } from '@/constants/theme';

export function FieldError({ message }: { message: string | null }) {
  return message ? <Text style={styles.error}>{message}</Text> : null;
}

const styles = StyleSheet.create({
  error: { color: Brand.red, fontSize: 12, marginTop: 4 },
});
