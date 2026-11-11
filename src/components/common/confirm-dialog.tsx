import type { LucideIcon } from 'lucide-react-native';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { Brand, Spacing } from '@/constants/theme';

export type Confirmation = {
  title: string;
  message: string;
  label: string;
  Icon: LucideIcon;
  onConfirm: () => void;
  cancelLabel?: string;
  destructive?: boolean;
};

export function ConfirmDialog({ confirmation, busy, onCancel }: {
  confirmation: Confirmation | null;
  busy: boolean;
  onCancel: () => void;
}) {
  if (!confirmation) return null;
  const { title, message, label, Icon, onConfirm, cancelLabel, destructive } = confirmation;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => { if (!busy) onCancel(); }}>
      <ScrollView contentContainerStyle={styles.backdrop} keyboardShouldPersistTaps="handled">
        <View style={styles.dialog} accessibilityViewIsModal>
          <Icon size={24} color={destructive ? '#FF4A52' : '#22D3EE'} />
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <AuthButton label={label} loading={busy} hideChevron onPress={onConfirm} />
          <AuthButton label={cancelLabel ?? 'Cancelar'} variant="ghost" disabled={busy} onPress={onCancel} />
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, backgroundColor: '#000B' },
  dialog: { width: '100%', maxWidth: 360, backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 22, padding: Spacing.four, gap: Spacing.two },
  title: { color: Brand.text, fontSize: 22, fontWeight: '800' },
  message: { color: Brand.textSecondary, fontSize: 16, marginBottom: Spacing.two },
});
