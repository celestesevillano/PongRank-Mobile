import { Image } from 'expo-image';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { PAID_PLANS, PLAN_LABEL, type PaidPlan } from '@/constants/plans';
import { PLAN_ART, planBenefits } from '@/constants/plan-presentation';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useToast } from '@/context/toast';
import { membershipsService } from '@/services/memberships.service';
import type { MembershipPlan } from '@/types/api';
import { toApiError } from '@/utils/api-error';

const DETAIL: Record<PaidPlan, string> = {
  BASIC: 'Para entender cómo te va en la mesa y ver tu progreso entre partidas.',
  PRO: 'Para seguir tu progreso y entrenar tu técnica de ping pong.',
  ENTERPRISE: 'Para abrir un club de ping pong y organizar a sus jugadores.',
};

export function PlansSheet({ visible, currentPlan, onClose }: {
  visible: boolean; currentPlan: MembershipPlan; onClose: () => void;
}) {
  const { showToast } = useToast();
  const { bottom, top } = useSafeAreaInsets();
  const [selected, setSelected] = useState<PaidPlan | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const offer = expanded ? PAID_PLANS.find(({ plan }) => plan === selected) : undefined;
  const art = offer ? PLAN_ART[offer.plan] : undefined;

  const close = () => {
    setSelected(null);
    setExpanded(false);
    onClose();
  };

  const pay = async () => {
    if (!selected || loading) return;
    setLoading(true);
    try {
      const { initPoint } = await membershipsService.createPreference(selected);
      await Linking.openURL(initPoint);
      close();
    } catch (error) {
      showToast(toApiError(error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { if (!loading) close(); }}>
      <View style={[styles.modal, { paddingTop: top + Spacing.two }]}>
        <Pressable style={styles.backdrop} onPress={close} disabled={loading} accessible={false} />
        <View style={[styles.sheet, { paddingBottom: Math.max(bottom, Spacing.three) }]} accessibilityViewIsModal>
          <View style={styles.handle} />
          <View style={styles.header}>
            {offer ? (
              <AuthButton label="Ver todos los planes" variant="text" icon={ArrowLeft} onPress={() => setExpanded(false)} disabled={loading} style={styles.back} />
            ) : (
              <View style={styles.flex}>
                <Text accessibilityRole="header" style={styles.title}>Elige tu plan</Text>
                <Text style={styles.secondary}>Cada comunidad o club que creas o al que te unes usa un espacio.</Text>
              </View>
            )}
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar planes" style={styles.close} onPress={close} disabled={loading}><X color={Brand.text} size={24} /></Pressable>
          </View>

          <ScrollView key={offer?.plan ?? 'options'} style={styles.scroll} contentContainerStyle={styles.options} showsVerticalScrollIndicator={false}>
            {offer && art ? (
              <>
                <Image source={art.image} contentFit="cover" style={[styles.art, { backgroundColor: art.background }]} />
                <View style={styles.detailHeader}>
                  <View style={styles.flex}>
                    <Text accessibilityRole="header" style={styles.title}>{PLAN_LABEL[offer.plan]}</Text>
                    {offer.recommended ? <Text style={styles.badge}>Recomendado</Text> : null}
                  </View>
                  <Price price={offer.price} />
                </View>
                <Text style={styles.secondary}>{DETAIL[offer.plan]}</Text>
                {planBenefits(offer.plan).map(({ Icon, title, description, availability }) => (
                  <View key={title} style={styles.benefit}>
                    <Icon size={17} color={art.accent} />
                    <View style={styles.flex}>
                      <Text style={styles.name}>{title}</Text>
                      <Text style={[styles.secondary, availability && styles.availability]}>{description}</Text>
                    </View>
                  </View>
                ))}
              </>
            ) : (
              PAID_PLANS.map(({ plan, price, recommended, description }) => {
                const active = plan === selected;
                return (
                  <Pressable
                    key={plan}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    disabled={loading}
                    onPress={() => { setSelected(plan); setExpanded(true); }}
                    style={[styles.option, active && styles.optionActive]}>
                    <View style={[styles.radio, active && styles.radioActive]}>{active ? <Check color={Brand.text} size={14} /> : null}</View>
                    <View style={styles.flex}>
                      <View style={styles.nameRow}>
                        <Text style={styles.name}>{PLAN_LABEL[plan]}</Text>
                        {recommended ? <Text style={styles.badge}>Recomendado</Text> : null}
                      </View>
                      <Text style={styles.secondary}>{description}</Text>
                    </View>
                    <Price price={price} />
                  </Pressable>
                );
              })
            )}
          </ScrollView>
          <AuthButton label="Continuar al pago" disabled={!selected} loading={loading} onPress={pay} />
          <Text style={styles.footer}>Tu plan actual es {currentPlan === 'FREEMIUM' ? 'Gratis' : PLAN_LABEL[currentPlan]}.</Text>
        </View>
      </View>
    </Modal>
  );
}

function Price({ price }: { price: string }) {
  return (
    <View style={styles.priceBox}>
      <Text style={styles.price}>{price}</Text>
      <Text style={styles.secondary}>al mes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  modal: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000B' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheet: { alignSelf: 'center', width: '100%', maxWidth: MaxContentWidth, flexShrink: 1, backgroundColor: '#0F0F11', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: Brand.border, paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#3A3A3F' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.two },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginRight: -8 },
  title: { color: Brand.text, fontSize: 26, fontWeight: '800' },
  secondary: { color: Brand.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 2 },
  back: { paddingVertical: Spacing.two, paddingHorizontal: 0 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  options: { gap: Spacing.two },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, minHeight: 76, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  optionActive: { borderColor: Brand.red, backgroundColor: '#281417' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#66666C', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Brand.primary, backgroundColor: Brand.primary },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  name: { color: Brand.text, fontSize: 15, fontWeight: '700' },
  badge: { alignSelf: 'flex-start', backgroundColor: Brand.primary, color: Brand.text, fontSize: 11, fontWeight: '700', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  priceBox: { alignItems: 'flex-end' },
  price: { color: Brand.text, fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] },
  footer: { color: Brand.textSecondary, fontSize: 13, textAlign: 'center' },
  art: { width: '100%', aspectRatio: 1.6, borderRadius: 14 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  benefit: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  availability: { color: '#FFD278' },
});
