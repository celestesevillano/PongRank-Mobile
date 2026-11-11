import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { Brand, Spacing } from '@/constants/theme';
import { useToast } from '@/context/toast';
import { communitiesService, type CommunityType } from '@/services/communities.service';
import { toApiError } from '@/utils/api-error';

const TYPES: { label: string; value: CommunityType }[] = [
  { label: 'Universidad', value: 'UNIVERSITY' },
  { label: 'Colegio', value: 'SCHOOL' },
  { label: 'Grupo de juego', value: 'PLAY_GROUP' },
  { label: 'Otro', value: 'OTHER' },
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
        <View style={styles.types}>
          {TYPES.map((item) => (
            <Pressable key={item.value} onPress={() => setType(item.value)} accessibilityRole="button" accessibilityState={{ selected: type === item.value }} style={[styles.chip, (item.value === 'UNIVERSITY' || item.value === 'PLAY_GROUP') && styles.wideChip, type === item.value && styles.chipActive]}>
              <Text style={styles.chipLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        {type === 'OTHER' && (
          <>
            <Text style={styles.label}>Etiqueta personalizada</Text>
            <AuthInput accessibilityLabel="Etiqueta personalizada" placeholder="Ej. Liga vecinal"
              value={customLabel} onChangeText={setCustomLabel} maxLength={40} />
          </>
        )}
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
  types: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
  chip: { flex: 1, minWidth: 0, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.two, paddingHorizontal: Spacing.one, borderRadius: 999, backgroundColor: Brand.surface },
  wideChip: { flex: 1.35 },
  chipActive: { backgroundColor: Brand.red },
  chipLabel: { color: Brand.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
