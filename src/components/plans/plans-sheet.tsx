import { Check, X } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { Brand, Spacing } from '@/constants/theme';
import { PAID_PLANS, PLAN_LABEL, type PaidPlan } from '@/constants/plans';
import { useToast } from '@/context/toast';
import { membershipsService } from '@/services/memberships.service';
import type { MembershipPlan } from '@/types/api';
import { toApiError } from '@/utils/api-error';

type PlansSheetProps = { visible: boolean; currentPlan: MembershipPlan; onClose: () => void };

export function PlansSheet({ visible, currentPlan, onClose }: PlansSheetProps) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<PaidPlan>('PRO');
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    try {
      const { initPoint } = await membershipsService.createPreference(selected);
      await Linking.openURL(initPoint);
      onClose();
    } catch (err) {
      showToast(toApiError(err).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.title}>Elige tu plan</Text>
            <Text style={styles.subtitle}>Cada comunidad o club que creas o al que te unes usa un espacio.</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Cerrar">
            <X color={Brand.text} size={24} />
          </Pressable>
        </View>

        <View style={styles.options}>
          {PAID_PLANS.map(({ plan, price, description, recommended }) => {
            const active = plan === selected;
            return (
              <Pressable key={plan} onPress={() => setSelected(plan)} style={[styles.option, active && styles.optionActive]} accessibilityRole="radio" accessibilityState={{ selected: active }}>
                <View style={[styles.radio, active && styles.radioActive]}>{active && <Check color="#fff" size={12} />}</View>
                <View style={styles.flex}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{PLAN_LABEL[plan]}</Text>
                    {recommended && <Text style={styles.badge}>Recomendado</Text>}
                  </View>
                  <Text style={styles.description}>{description}</Text>
                </View>
                <View style={styles.priceBox}>
                  <Text style={styles.price}>{price}</Text>
                  <Text style={styles.perMonth}>al mes</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <AuthButton label="Continuar al pago" hideChevron loading={loading} onPress={pay} />
        <Text style={styles.footer}>Tu plan actual es {PLAN_LABEL[currentPlan]}.</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheet: { backgroundColor: '#0F0F11', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderTopColor: Brand.border, padding: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#3A3A3F' },
  header: { flexDirection: 'row', gap: Spacing.three },
  title: { color: Brand.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#B8BAC0', fontSize: 14, lineHeight: 20, marginTop: Spacing.one },
  options: { gap: Spacing.two },
  option: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: 14, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  optionActive: { borderColor: Brand.red, backgroundColor: 'rgba(216,30,40,0.12)' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#5C5C5C', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Brand.red, backgroundColor: Brand.red },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  name: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  badge: { backgroundColor: Brand.red, color: '#fff', fontSize: 12, fontWeight: '700', borderRadius: 11, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  description: { color: '#B8BAC0', fontSize: 13, marginTop: 2 },
  priceBox: { alignItems: 'flex-end' },
  price: { color: Brand.text, fontSize: 18, fontWeight: '800' },
  perMonth: { color: Brand.textSecondary, fontSize: 12 },
  footer: { color: Brand.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
