import { router } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { AddressField } from '@/components/clubs/address-field';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { CommunityScreen } from '@/components/communities/community-screen';
import { Brand, Spacing } from '@/constants/theme';
import { usePlan } from '@/context/plan';
import { useToast } from '@/context/toast';
import { clubsService } from '@/services/clubs.service';
import { toApiError } from '@/utils/api-error';

export default function RegisterClubScreen() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [document, setDocument] = useState('');
  const [saving, setSaving] = useState(false);
  const [sentClubId, setSentClubId] = useState<number | null>(null);
  const { refresh } = usePlan();
  const { showToast } = useToast();
  const canSubmit = Boolean(name.trim() && address.trim() && document.trim());

  const submit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const club = await clubsService.register({ name: name.trim(), address: address.trim(), affiliationDocumentUrl: document.trim() });
      void refresh();
      setSentClubId(club.id);
    } catch (error) {
      showToast(toApiError(error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <CommunityScreen title="Registrar club" onBack={() => router.dismissTo('/social')}>
      <KeyboardAvoidingView style={styles.layout} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
          <Text style={styles.label}>Nombre</Text>
          <AuthInput accessibilityLabel="Nombre del club" value={name} onChangeText={setName} maxLength={150} />
          <Text style={styles.label}>Dirección</Text>
          <AddressField value={address} onChange={setAddress} />
          <Text style={styles.label}>Documento de afiliación a la FDPTM (enlace)</Text>
          <AuthInput accessibilityLabel="Enlace al documento de afiliación a la FDPTM" placeholder="https://" value={document}
            onChangeText={setDocument} autoCapitalize="none" keyboardType="url" maxLength={500} />
          <Text style={styles.note}>Es el comprobante de que tu club está afiliado a la Federación Deportiva Peruana de Tenis de Mesa. Un administrador lo revisará antes de publicar tu club.</Text>
        </ScrollView>
        <View style={styles.footer}>
          <AuthButton label="Registrar club" icon={Send} disabled={!canSubmit} loading={saving} onPress={submit} />
        </View>
      </KeyboardAvoidingView>
      <ConfirmDialog busy={false} onCancel={() => undefined} confirmation={sentClubId !== null ? {
        title: 'Club enviado a revisión', message: 'Un administrador revisará tu club antes de publicarlo. Puedes ver su estado en Mis clubes.',
        label: 'Aceptar', Icon: Send, success: true, infoOnly: true,
        onConfirm: () => router.replace({ pathname: '/social/club', params: { id: sentClubId } }),
      } : null} />
    </CommunityScreen>
  );
}

const styles = StyleSheet.create({
  layout: { flex: 1 },
  footer: { paddingBottom: Spacing.four },
  form: { gap: Spacing.two, paddingBottom: Spacing.three },
  label: { color: Brand.text, fontWeight: '600' },
  note: { color: Brand.textSecondary, fontSize: 14 },
});
