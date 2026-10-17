import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { communitiesService, type CommunityType } from '@/services/communities.service';
import { toApiError } from '@/utils/api-error';

const TYPES: { label: string; value: CommunityType }[] = [
  { label: 'Universidad', value: 'UNIVERSITY' },
  { label: 'Colegio', value: 'SCHOOL' },
  { label: 'Parque', value: 'PUBLIC_PARK' },
  { label: 'Otro', value: 'OTHER' },
];

export default function CreateCommunityScreen() {
  const { completeOnboarding } = useSession();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CommunityType>('OTHER');
  const [loading, setLoading] = useState(false);

  const nameValid = name.trim().length >= 3;

  const submit = async () => {
    setLoading(true);
    try {
      await communitiesService.create({ name: name.trim(), description: description.trim() || undefined, communityType: type });
      showToast('Comunidad creada.');
      completeOnboarding();
    } catch (err) {
      showToast(toApiError(err).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{'‹'}</Text>
        </Pressable>
        <Text style={styles.title}>Crea tu comunidad</Text>
        <AuthInput placeholder="Nombre (mínimo 3 caracteres)" value={name} onChangeText={setName} maxLength={120} />
        <AuthInput placeholder="Descripción (opcional)" value={description} onChangeText={setDescription} maxLength={500} multiline />
        <View style={styles.types}>
          {TYPES.map((item) => (
            <Pressable key={item.value} onPress={() => setType(item.value)} style={[styles.chip, type === item.value && styles.chipActive]}>
              <Text style={styles.chipLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <AuthButton label="Crear comunidad" disabled={!nameValid} loading={loading} onPress={submit} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, gap: Spacing.three },
  back: { color: Brand.text, fontSize: 28 },
  title: { color: Brand.text, fontSize: 26, fontWeight: '700', textAlign: 'center' },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: 999, backgroundColor: Brand.surface },
  chipActive: { backgroundColor: Brand.red },
  chipLabel: { color: Brand.text, fontWeight: '600' },
});
