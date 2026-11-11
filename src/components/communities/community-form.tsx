import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { Brand, Spacing } from '@/constants/theme';
import { useToast } from '@/context/toast';
import { communitiesService, type CommunityType } from '@/services/communities.service';
import { toApiError } from '@/utils/api-error';

const TYPES: { label: string; value: CommunityType }[] = [
  { label: 'Universidad', value: 'UNIVERSITY' },
  { label: 'Colegio', value: 'SCHOOL' },
  { label: 'Parque', value: 'PUBLIC_PARK' },
  { label: 'Otro', value: 'OTHER' },
];

export function CommunityForm({ onCreated }: { onCreated: () => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CommunityType>('OTHER');
  const [loading, setLoading] = useState(false);
  const [nameTaken, setNameTaken] = useState(false);

  const nameValid = name.trim().length >= 3;

  const submit = async () => {
    setLoading(true);
    try {
      await communitiesService.create({ name: name.trim(), description: description.trim() || undefined, communityType: type });
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
    <View style={styles.form}>
      <Text style={styles.label}>Nombre</Text>
      <AuthInput accessibilityLabel="Nombre" placeholder="Ej. UTEC Norte" value={name} onChangeText={(value) => { setName(value); setNameTaken(false); }} maxLength={120} />
      {nameTaken && <Text accessibilityRole="alert" style={styles.error}>Ese nombre ya está en uso. Elige otro.</Text>}
      <Text style={styles.label}>Descripción (opcional)</Text>
      <AuthInput accessibilityLabel="Descripción opcional" value={description} onChangeText={setDescription} maxLength={500} multiline />
      <Text style={styles.label}>Tipo de comunidad</Text>
      <View style={styles.types}>
        {TYPES.map((item) => (
          <Pressable key={item.value} onPress={() => setType(item.value)} accessibilityRole="button" accessibilityState={{ selected: type === item.value }} style={[styles.chip, item.value === 'UNIVERSITY' && styles.wideChip, type === item.value && styles.chipActive]}>
            <Text style={styles.chipLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <AuthButton label="Crear comunidad" disabled={!nameValid || nameTaken} loading={loading} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.two },
  label: { color: Brand.text, fontWeight: '600' },
  error: { color: '#FF6B72' },
  types: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
  chip: { flex: 1, minWidth: 0, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.two, paddingHorizontal: Spacing.one, borderRadius: 999, backgroundColor: Brand.surface },
  wideChip: { flex: 1.35 },
  chipActive: { backgroundColor: Brand.red },
  chipLabel: { color: Brand.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
