import { Image } from 'expo-image';
import { ChevronRight, ShieldCheck, UserCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';
import type { CommunityResponse } from '@/types/api';

const communityCover = require('../../../assets/images/pongrank-comunidad-portada.webp');

const TYPE_LABEL: Record<CommunityResponse['communityType'], string> = {
  UNIVERSITY: 'Universidad',
  SCHOOL: 'Colegio',
  PUBLIC_PARK: 'Parque',
  PLAY_GROUP: 'Grupo de juego',
  OTHER: 'Comunidad',
};

export function CommunityCard({ community, onPress, featured = false, creatorName, isMember, isAdmin }: { community: CommunityResponse; onPress?: () => void; featured?: boolean; creatorName?: string | null; isMember?: boolean; isAdmin?: boolean }) {
  const initials = community.name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toLocaleUpperCase('es');
  const roleColor = isAdmin ? '#22D3EE' : '#2ECC71';
  const RoleIcon = isAdmin ? ShieldCheck : UserCheck;
  const mark = <Text style={styles.mark}>{initials}</Text>;
  const content = (
    <>
      {featured && (
        <View style={styles.cover}>
          <Image
            source={communityCover}
            contentFit="cover"
            contentPosition="right center"
            style={StyleSheet.absoluteFill}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <View style={styles.coverContent}>{mark}</View>
        </View>
      )}
      <View style={styles.row}>
        {!featured && mark}
        <View style={styles.label}>
          <Text style={[styles.name, featured && styles.featuredName]}>{community.name}</Text>
          <Text style={styles.meta}>{community.memberCount} {community.memberCount === 1 ? 'miembro' : 'miembros'} · {community.customLabel || TYPE_LABEL[community.communityType]}</Text>
          {!featured && community.status === 'DELETED' && <Text style={styles.meta}>Eliminada</Text>}
          {featured && creatorName && <Text style={styles.meta}>Creada por {creatorName}</Text>}
          {featured && (isMember || isAdmin) && (
            <View style={styles.memberBadge}>
              <RoleIcon size={14} color={roleColor} />
              <Text style={[styles.memberLabel, { color: roleColor }]}>{isAdmin ? 'Administrador' : 'Eres miembro'}</Text>
            </View>
          )}
        </View>
        {onPress && <ChevronRight color={Brand.textSecondary} size={20} />}
      </View>
    </>
  );

  return onPress
    ? <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>{content}</Pressable>
    : <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  pressed: { opacity: 0.78 },
  cover: { aspectRatio: 3, backgroundColor: Brand.surface, justifyContent: 'flex-end', overflow: 'hidden' },
  coverContent: { padding: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  mark: { backgroundColor: '#132D36', color: '#22D3EE', minWidth: 42, padding: 10, textAlign: 'center', borderRadius: 10, fontWeight: '800', overflow: 'hidden', alignSelf: 'flex-start' },
  label: { flex: 1, gap: Spacing.one },
  name: { color: Brand.text, fontSize: 15, fontWeight: '700' },
  featuredName: { fontSize: 26, fontWeight: '800' },
  memberBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#294049', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5,
  },
  memberLabel: { fontSize: 12, fontWeight: '700' },
  meta: { color: Brand.textSecondary, fontSize: 13 },
});
