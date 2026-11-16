import { Image } from 'expo-image';
import { ChevronRight, MapPin, ShieldCheck, UserCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { Brand, Spacing } from '@/constants/theme';

const clubArtwork = require('../../../assets/images/club-portada.webp');

export function ClubCard({ name, description, featured, role, creatorName, memberCount, pending, onPress }: {
  name: string;
  description: string;
  featured?: boolean;
  role?: 'admin' | 'member';
  creatorName?: string | null;
  memberCount?: number | null;
  pending?: boolean;
  onPress?: () => void;
}) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toLocaleUpperCase('es');
  const RoleIcon = role === 'admin' ? ShieldCheck : UserCheck;
  const roleColor = role === 'admin' ? '#22D3EE' : '#2ECC71';
  const content = (
    <>
      {featured && (
        <View style={styles.cover}>
          <Image source={clubArtwork} style={StyleSheet.absoluteFill} contentFit="cover"
            accessibilityElementsHidden importantForAccessibility="no" />
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
          {featured && <Text style={styles.description}>
            {memberCount == null ? 'Club' : `${memberCount} ${memberCount === 1 ? 'miembro' : 'miembros'} · Club`}
          </Text>}
          {!!description && (featured ? <View style={styles.location}>
            <MapPin size={14} color={Brand.textSecondary} /><Text style={[styles.description, styles.locationText]}>{description}</Text>
          </View> : <Text style={styles.description}>{description}</Text>)}
          {pending && <View style={styles.role}><Text style={styles.pending}>Solicitud pendiente</Text></View>}
          {featured && !!creatorName && <Text style={styles.description}>Creado por {creatorName}</Text>}
          {role && (
            <View style={styles.role}><RoleIcon size={14} color={roleColor} />
              <Text style={[styles.roleText, { color: roleColor }]}>{role === 'admin' ? 'Administrador' : 'Eres miembro'}</Text>
            </View>
          )}
        </View>
        {onPress && <ChevronRight size={18} color={Brand.textSecondary} />}
      </View>
    </>
  );

  return onPress
    ? <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>{content}</Pressable>
    : <View style={styles.card}>{content}</View>;
}

export function ClubAbout({ description }: { description?: string | null }) {
  if (!description) return null;
  return (
    <View style={styles.about}>
      <Text accessibilityRole="header" style={styles.aboutTitle}>Sobre el club</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  about: { gap: Spacing.two },
  aboutTitle: { color: Brand.text, fontSize: 18, fontWeight: '700' },
  card: { backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  cover: { aspectRatio: 3, justifyContent: 'center', paddingHorizontal: Spacing.three },
  crest: { width: 64, height: 72, alignItems: 'center', justifyContent: 'center', paddingBottom: 10 },
  crestText: { color: Brand.text, fontSize: 24, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  mark: { minWidth: 42, textAlign: 'center', padding: 10, borderRadius: 8, backgroundColor: '#30171B', color: '#FF8085', fontWeight: '800', overflow: 'hidden' },
  info: { flex: 1, gap: 4 },
  name: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  featuredName: { fontSize: 24 },
  role: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#294049', borderRadius: 14 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { flexShrink: 1 },
  pending: { color: '#22D3EE', fontSize: 12, fontWeight: '700' },
  roleText: { fontSize: 12, fontWeight: '700' },
  description: { color: Brand.textSecondary, fontSize: 14 },
});
