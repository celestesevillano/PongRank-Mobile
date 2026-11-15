import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { CommunityCard } from '@/components/communities/community-card';
import { PillTabs } from '@/components/common/pill-tabs';
import { Brand, Spacing } from '@/constants/theme';
import { useToast } from '@/context/toast';
import { communitiesService, type CommunityType } from '@/services/communities.service';
import { toApiError } from '@/utils/api-error';

const TYPES: { label: string; key: CommunityType }[] = [
  { label: 'Universidad', key: 'UNIVERSITY' },
  { label: 'Colegio', key: 'SCHOOL' },
  { label: 'Grupo de juego', key: 'PLAY_GROUP' },
  { label: 'Otro', key: 'OTHER' },
];

export function CommunityForm({ onCreated }: { onCreated: () => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CommunityType>('UNIVERSITY');
  const [customLabel, setCustomLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameTaken, setNameTaken] = useState(false);

  const canSubmit = name.trim().length >= 3 && !nameTaken && (type !== 'OTHER' || Boolean(customLabel.trim()));

  const submit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      await communitiesService.create({ name: name.trim(), description: description.trim() || undefined, communityType: type, customLabel: type === 'OTHER' ? customLabel.trim() : undefined });
      showToast('Comunidad creada.');
      onCreated();
    } catch (err) {
      const error = toApiError(err);
      if (error.status === 409) setNameTaken(true);
      else showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.layout} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
        <Text style={styles.label}>Nombre</Text>
        <AuthInput accessibilityLabel="Nombre" placeholder="Ej. UTEC Norte" value={name} onChangeText={(value) => { setName(value); setNameTaken(false); }} maxLength={120} />
        {nameTaken && <Text accessibilityRole="alert" style={styles.error}>Ese nombre ya está en uso. Elige otro.</Text>}
        <Text style={styles.label}>Descripción (opcional)</Text>
        <AuthInput accessibilityLabel="Descripción opcional" value={description} onChangeText={setDescription} maxLength={500} multiline />
        <Text style={styles.label}>Tipo de comunidad</Text>
        <PillTabs variant="chip" options={TYPES} selected={type} onSelect={setType} />
        {type === 'OTHER' && (
          <>
            <Text style={styles.label}>Etiqueta personalizada</Text>
            <AuthInput accessibilityLabel="Etiqueta personalizada" placeholder="Ej. Liga vecinal"
              value={customLabel} onChangeText={setCustomLabel} maxLength={40} />
          </>
        )}
        {name.trim().length >= 3 ? (
          <>
            <Text accessibilityRole="header" style={styles.label}>Vista previa</Text>
            <CommunityCard featured community={{
              id: 0, name: name.trim(), description: description.trim() || null,
              memberCount: 1, communityType: type, customLabel: type === 'OTHER' ? customLabel.trim() : undefined,
            }} />
          </>
        ) : null}
      </ScrollView>
      <AuthButton label="Crear comunidad" icon={Plus} disabled={!canSubmit} loading={loading} onPress={submit} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  layout: { flex: 1, gap: Spacing.two, paddingBottom: Spacing.two },
  form: { gap: Spacing.two, paddingBottom: Spacing.three },
  label: { color: Brand.text, fontWeight: '600' },
  error: { color: '#FF6B72' },
});
