import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { BrandIcon } from '@/components/common/brand-icon';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { playersService } from '@/services/players.service';
import { whatsAppInternationalNumber } from '@/utils/whatsapp';

export function WhatsAppPreference() {
  const { player, updateLocalPlayer } = useSession();
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!player) return null;

  const save = async (shareContact: boolean, whatsapp?: string) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const updated = await playersService.update(player.id, { shareContact, ...(whatsapp ? { whatsapp } : {}) });
      updateLocalPlayer(updated);
      setOpen(false);
    } catch {
      setError('No pudimos guardar el cambio. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = (enable: boolean) => {
    setError('');
    if (!enable) {
      void save(false);
      return;
    }
    const previous = whatsAppInternationalNumber(player.whatsapp);
    setNumber(previous?.match(/^51(9\d{8})$/)?.[1] ?? '');
    setOpen(true);
  };

  const activate = () => {
    if (!/^9\d{8}$/.test(number)) {
      setError('Ingresa un número peruano de 9 dígitos que empiece con 9.');
      return;
    }
    void save(true, `+51${number}`);
  };

  return (
    <>
      <View style={styles.row}>
        <BrandIcon name="whatsapp" color="#25D366" size={21} />
        <View style={styles.copy}>
          <Text style={styles.label}>Compartir WhatsApp</Text>
          <Text style={styles.secondary}>Para coordinar partidas confirmadas</Text>
        </View>
        <Switch accessibilityLabel="Compartir WhatsApp" value={player.shareContact} onValueChange={toggle} disabled={busy} trackColor={{ true: '#16818E', false: Brand.border }} />
      </View>
      {!open && error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => { if (!busy) setOpen(false); }}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.backdrop} keyboardShouldPersistTaps="handled">
            <View accessibilityViewIsModal style={styles.dialog}>
              <Text accessibilityRole="header" style={styles.heading}>Compartir WhatsApp</Text>
              <Text style={styles.secondary}>Tu rival podrá ver tu número cuando ambos participen en la partida.</Text>
              <Text style={styles.label}>Número de WhatsApp</Text>
              <View style={styles.field}>
                <Text style={styles.prefix}>+51</Text>
                <TextInput
                  value={number}
                  onChangeText={(text) => { setNumber(text.replace(/\D/g, '').slice(0, 9)); setError(''); }}
                  editable={!busy}
                  accessibilityLabel="Número de WhatsApp"
                  autoComplete="tel-national"
                  keyboardType="number-pad"
                  placeholder="999 999 999"
                  placeholderTextColor={Brand.textSecondary}
                  style={styles.input}
                />
              </View>
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              <AuthButton label="Guardar y activar" onPress={activate} loading={busy} />
              <AuthButton label="Cancelar" variant="secondary" onPress={() => setOpen(false)} disabled={busy} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderColor: Brand.border, borderRadius: 14, backgroundColor: Brand.surface },
  copy: { flex: 1, gap: 3 },
  heading: { color: Brand.text, fontSize: 24, fontWeight: '800' },
  label: { color: Brand.text, fontSize: 15, fontWeight: '700' },
  secondary: { color: Brand.textSecondary, fontSize: 13, lineHeight: 18 },
  error: { color: '#FFB3B8', fontSize: 13 },
  backdrop: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.three, backgroundColor: '#000B' },
  dialog: { width: '100%', maxWidth: 360, padding: Spacing.three, gap: 12, borderRadius: 18, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  field: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.background, flexDirection: 'row', gap: Spacing.two, alignItems: 'center', paddingHorizontal: 12 },
  prefix: { color: Brand.textSecondary, fontWeight: '700' },
  input: { flex: 1, color: Brand.text, fontSize: 16, paddingVertical: Spacing.two },
});
