import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { Layers } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { CardLighting } from '@/components/common/card-lighting';
import { ScreenState } from '@/components/common/screen-state';
import { ProfileScreen } from '@/components/profile/profile-screen';
import { PLAN_ART, planBenefits } from '@/constants/plan-presentation';
import { PLAN_LABEL } from '@/constants/plans';
import { Brand, Spacing } from '@/constants/theme';
import { usePlan } from '@/context/plan';
import { useFetch } from '@/hooks/use-fetch';
import { membershipsService } from '@/services/memberships.service';

export default function MyPlanRoute() {
  const { plan, openPlans } = usePlan();
  const [visit, setVisit] = useState(0);
  const lookup = useFetch((signal) => visit > 0 ? membershipsService.me(signal) : Promise.resolve(null), [visit]);
  useFocusEffect(useCallback(() => { setVisit((value) => value + 1); }, []));
  const current = lookup.data ?? plan;
  const art = current ? PLAN_ART[current.plan] : null;
  const capacity = current?.maxSpaces;
  const used = current?.usedSpaces;
  const quotaKnown = capacity != null && used != null;
  const ratio = quotaKnown && capacity > 0 ? Math.min(100, Math.max(0, used / capacity * 100)) : 0;

  return (
    <ProfileScreen
      title="Mi plan"
      back={{ label: 'Perfil', route: '/profile' }}
      footer={<AuthButton label="Ver planes" icon={Layers} onPress={openPlans} />}>
      {current && art ? (
        <>
          <View style={[styles.hero, { backgroundColor: art.background, borderColor: art.accent }]}>
            <CardLighting color={art.accent} />
            <Image source={art.image} contentFit="contain" style={styles.artwork} accessible={false} />
            <View style={styles.heroCopy}>
              <Text style={[styles.heroLabel, { color: art.accent }]}>PLAN ACTUAL</Text>
              <Text style={styles.heroTitle}>{current.plan === 'FREEMIUM' ? 'Gratis' : PLAN_LABEL[current.plan]}</Text>
              {current.endDate ? (
                <Text style={styles.secondary}>Vence el {new Date(current.endDate).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.card}>
            <View style={styles.quotaHeader}>
              <Text accessibilityRole="header" style={styles.title}>Tus espacios</Text>
              {quotaKnown ? (
                <Text style={[styles.number, { color: art.accent }]}>{used} <Text style={styles.secondary}>de {capacity}</Text></Text>
              ) : null}
            </View>
            {quotaKnown ? (
              <View accessibilityRole="progressbar" accessibilityLabel="Espacios usados" accessibilityValue={{ text: `${used} de ${capacity}` }} style={styles.track}>
                <View style={[styles.fill, { width: `${ratio}%`, backgroundColor: art.accent }]} />
              </View>
            ) : <Text style={styles.secondary}>El uso de espacios no está disponible.</Text>}
            <Text style={styles.secondary}>Cada comunidad o club usa 1 espacio.</Text>
          </View>
          <View style={[styles.card, { borderLeftColor: art.accent, borderLeftWidth: 2 }]}>
            <Text accessibilityRole="header" style={styles.title}>Qué incluye</Text>
            {planBenefits(current.plan, current).map(({ Icon, title, description, availability }) => (
              <View key={title} style={styles.benefit}>
                <Icon color={art.accent} size={18} />
                <View style={styles.benefitCopy}>
                  <View style={styles.benefitName}>
                    <Text style={styles.benefitTitle}>{title}</Text>
                    {availability ? <Text style={styles.soon}>Próximamente</Text> : null}
                  </View>
                  <Text style={styles.secondary}>{description}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : <ScreenState loading={lookup.loading} error={lookup.error} onRetry={lookup.refetch} />}
    </ProfileScreen>
  );
}

const styles = StyleSheet.create({
  hero: { position: 'relative', overflow: 'hidden', minHeight: 146, borderWidth: 1, borderRadius: 16, justifyContent: 'center', padding: Spacing.three },
  artwork: { position: 'absolute', width: '65%', height: '100%', right: 0 },
  heroCopy: { maxWidth: '59%', alignSelf: 'flex-start', paddingVertical: Spacing.two, paddingRight: Spacing.one, gap: 4 },
  heroLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.7 },
  heroTitle: { color: Brand.text, fontSize: 28, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 7 },
  card: { padding: Spacing.three, gap: 10, borderWidth: 1, borderColor: Brand.border, borderRadius: 14, backgroundColor: Brand.surface },
  quotaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  title: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  secondary: { color: Brand.textSecondary, fontSize: 13, lineHeight: 18 },
  number: { fontSize: 25, fontWeight: '800', fontVariant: ['tabular-nums'] },
  track: { backgroundColor: '#333339', height: 8, borderRadius: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 8 },
  benefit: { flexDirection: 'row', gap: Spacing.two },
  benefitCopy: { flex: 1, gap: 3 },
  benefitTitle: { color: Brand.text, fontWeight: '700', fontSize: 14 },
  benefitName: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  soon: { color: Brand.textSecondary, fontSize: 11, fontWeight: '700', borderWidth: 1, borderColor: Brand.border, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 1, overflow: 'hidden' },
});
