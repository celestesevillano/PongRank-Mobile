import { Linking, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { BrandIcon } from '@/components/common/brand-icon';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import type { PlayerSummary } from '@/types/api';
import { whatsAppInternationalNumber } from '@/utils/whatsapp';

export function WhatsAppMatchButton({ opponent, showUnavailable = false, compact = false, style }: { opponent: PlayerSummary; showUnavailable?: boolean; compact?: boolean; style?: StyleProp<ViewStyle> }) {
  const { player } = useSession();
  const { showToast } = useToast();
  const phone = whatsAppInternationalNumber(opponent.whatsapp);
  if (!phone && !showUnavailable) return null;

  const open = async () => {
    if (!phone) return;
    const firstName = opponent.name.trim().split(/\s+/)[0];
    const sender = player?.name.trim() ? ` Soy ${player.name.trim()}, de PongRank 🏓.` : '';
    const message = `¡Hola, ${firstName}!${sender} Te escribo por la partida que confirmamos. ¿Qué hora te queda bien?`;
    try {
      await Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
    } catch {
      showToast('No pudimos abrir WhatsApp. Intenta de nuevo.', 'error');
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !phone }}
        disabled={!phone}
        onPress={open}
        style={({ pressed }) => [styles.button, style, !phone && styles.disabled, pressed && styles.pressed]}>
        <BrandIcon name="whatsapp" color={phone ? Brand.text : Brand.textDisabled} size={18} />
        <Text style={[styles.label, !phone && styles.disabledLabel]}>{compact ? 'Coordinar' : 'Coordinar por WhatsApp'}</Text>
      </Pressable>
      {!phone && !compact ? <Text style={styles.note}>Tu rival no comparte WhatsApp para esta partida.</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.two, borderWidth: 1, borderColor: Brand.secondaryBorder, borderRadius: 14 },
  disabled: { backgroundColor: Brand.surfaceDisabled, borderColor: Brand.border },
  pressed: { opacity: 0.75 },
  label: { color: Brand.text, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  disabledLabel: { color: Brand.textDisabled },
  note: { color: Brand.textSecondary, fontSize: 13, textAlign: 'center' },
});
