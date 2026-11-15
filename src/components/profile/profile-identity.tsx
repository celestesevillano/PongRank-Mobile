import { Image } from 'expo-image';
import { MapPin } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { CardLighting } from '@/components/common/card-lighting';
import { Brand, Spacing } from '@/constants/theme';
import type { ProfilePresentation } from '@/utils/profile-presentation';

const paddle = require('../../../assets/images/pongrank-intro-paddle.png');

export function ProfileAvatar({ name, photo }: { name: string; photo: string | null }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();
  return (
    <View style={styles.avatar}>
      {photo ? <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" /> : <Text style={styles.initials}>{initials}</Text>}
      <Image source={paddle} style={styles.paddle} contentFit="contain" accessible={false} />
    </View>
  );
}

export function ProfileIdentity({ name, username, data }: {
  name: string; username?: string | null; data: ProfilePresentation;
}) {
  return (
    <View style={styles.card}>
      <CardLighting color={Brand.cyan} court />
      <ProfileAvatar name={name} photo={data.photo} />
      <Text style={styles.name}>{name}</Text>
      {username ? <Text style={styles.secondary}>@{username.replace(/^@/, '')}</Text> : null}
      {data.city ? <View style={styles.location}><MapPin color={Brand.cyan} size={14} /><Text style={styles.secondary}>{data.city}</Text></View> : null}
      {data.description ? <Text style={styles.description}>{data.description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#245761', backgroundColor: '#10191E', padding: Spacing.three, gap: 6, alignItems: 'flex-start' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#142A34', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Brand.cyan, marginBottom: 4 },
  photo: { width: '100%', height: '100%', borderRadius: 36 },
  initials: { color: Brand.text, fontWeight: '800', fontSize: 22 },
  paddle: { position: 'absolute', right: -10, bottom: -5, width: 37, height: 37 },
  name: { color: Brand.text, fontSize: 24, fontWeight: '800' },
  secondary: { color: Brand.textSecondary, fontSize: 14 },
  description: { color: Brand.text, fontSize: 14, lineHeight: 20, flexShrink: 1 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
