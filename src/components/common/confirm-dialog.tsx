import type { LucideIcon } from 'lucide-react-native';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ActionRow } from '@/components/common/action-row';
import { Brand, Spacing } from '@/constants/theme';

export type Confirmation = {
  title: string;
  message: string;
  label: string;
  Icon: LucideIcon;
  onConfirm: () => void;
  cancelLabel?: string;
  // Aviso informativo: un solo botón «Aceptar», sin cancelar
  infoOnly?: boolean;
  destructive?: boolean;
};

export function ConfirmDialog({ confirmation, busy, onCancel }: {
  confirmation: Confirmation | null;
  busy: boolean;
  onCancel: () => void;
}) {
  if (!confirmation) return null;
  const { title, message, label, Icon, onConfirm, cancelLabel, destructive, infoOnly } = confirmation;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => { if (!busy) onCancel(); }}>
      <ScrollView contentContainerStyle={styles.backdrop} keyboardShouldPersistTaps="handled">
        <View style={styles.dialog} accessibilityViewIsModal>
          <View style={[styles.circle, { borderColor: destructive ? '#FF4A52' : '#22D3EE' }]}><Icon size={21} color={destructive ? '#FF4A52' : '#22D3EE'} /></View>
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {infoOnly ? (
            <AuthButton label="Aceptar" hideChevron onPress={onConfirm} style={styles.single} />
          ) : (
            <ActionRow>
              <AuthButton label={cancelLabel ?? 'Cancelar'} variant="secondary" disabled={busy} onPress={onCancel} />
              <AuthButton label={label} loading={busy} hideChevron onPress={onConfirm} />
            </ActionRow>
          )}
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, backgroundColor: '#000B' },
  dialog: { width: '100%', maxWidth: 320, alignItems: 'center', backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 20, padding: Spacing.three, paddingVertical: 18, gap: Spacing.two },
  single: { minWidth: 112 },
  circle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, backgroundColor: '#232326', alignItems: 'center', justifyContent: 'center' },
  title: { color: Brand.text, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  message: { color: Brand.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: Spacing.two },
});
