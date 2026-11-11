import { router } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
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
  const { refresh } = usePlan();
  const { showToast } = useToast();
  const canSubmit = Boolean(name.trim() && address.trim() && document.trim());

  const submit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const club = await clubsService.register({ name: name.trim(), address: address.trim(), affiliationDocumentUrl: document.trim() });
      void refresh();
      showToast('Club enviado a revisión.');
      router.replace({ pathname: '/social/club', params: { id: club.id } });
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
          <AuthInput accessibilityLabel="Dirección" value={address} onChangeText={setAddress} maxLength={250} />
          <Text style={styles.label}>Enlace al documento de afiliación</Text>
          <AuthInput accessibilityLabel="Enlace al documento de afiliación" placeholder="https://" value={document}
            onChangeText={setDocument} autoCapitalize="none" keyboardType="url" maxLength={500} />
          <Text style={styles.note}>Revisaremos el documento antes de publicar tu club.</Text>
        </ScrollView>
        <AuthButton label="Enviar a revisión" icon={Send} disabled={!canSubmit} loading={saving} onPress={submit} />
      </KeyboardAvoidingView>
    </CommunityScreen>
  );
}

const styles = StyleSheet.create({
  layout: { flex: 1, paddingBottom: Spacing.two },
  form: { gap: Spacing.two, paddingBottom: Spacing.three },
  label: { color: Brand.text, fontWeight: '600' },
  note: { color: Brand.textSecondary, fontSize: 14 },
});
