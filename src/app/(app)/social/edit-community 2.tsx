import { router, useLocalSearchParams } from 'expo-router';
import { Archive, Check } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { CommunityScreen } from '@/components/communities/community-screen';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ScreenState } from '@/components/common/screen-state';
import { Brand, Spacing } from '@/constants/theme';
import { usePlan } from '@/context/plan';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { communitiesService } from '@/services/communities.service';
import { toApiError } from '@/utils/api-error';

export default function EditCommunityScreen() {
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const id = Number(communityId);
  const detail = useFetch((signal) => communitiesService.detail(id, signal), [id]);
  const community = detail.data;
  const onBack = () => router.canGoBack() ? router.back() : router.replace('/social');

  return (
    <CommunityScreen title="Editar comunidad" onBack={onBack}>
      <ScreenState loading={detail.loading} error={detail.error} onRetry={detail.refetch} />
      {!detail.loading && !detail.error && community && (
        community.status === 'ACTIVE' && community.myRole === 'COMMUNITY_ADMIN'
          ? <EditForm key={id} id={id} initialName={community.name} initialDescription={community.description ?? ''} onSaved={onBack} />
          : <Text style={styles.note}>Esta comunidad ya no está disponible para edición.</Text>
      )}
    </CommunityScreen>
  );
}

function EditForm({ id, initialName, initialDescription, onSaved }: {
  id: number;
  initialName: string;
  initialDescription: string;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [busy, setBusy] = useState<'save' | 'archive' | null>(null);
  const { refresh } = usePlan();
  const { showToast } = useToast();
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const canSave = trimmedName.length >= 3
    && (trimmedName !== initialName.trim() || trimmedDescription !== initialDescription.trim());

  async function save() {
    if (busy || !canSave) return;
    setBusy('save');
    try {
      await communitiesService.update(id, { name: trimmedName, description: trimmedDescription });
      showToast('Cambios guardados.');
      onSaved();
    } catch (error) {
      showToast(toApiError(error).message, 'error');
    } finally {
      setBusy(null);
    }
  }

  async function archive() {
    if (busy) return;
    setBusy('archive');
    try {
      await communitiesService.archive(id);
      showToast('Comunidad archivada.');
      void refresh();
      router.dismissTo('/social');
    } catch (error) {
      showToast(toApiError(error).message, 'error');
    } finally {
      setConfirmArchive(false);
      setBusy(null);
    }
  }

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nombre</Text>
        <AuthInput accessibilityLabel="Nombre" value={name} onChangeText={setName} maxLength={120} editable={!busy} />
        {trimmedName.length < 3 && <Text style={styles.note}>Escribe al menos 3 caracteres.</Text>}
        <Text style={styles.label}>Descripción</Text>
        <AuthInput accessibilityLabel="Descripción" value={description} onChangeText={setDescription}
          maxLength={500} multiline editable={!busy} />
        <View style={styles.archive}>
          <Text style={styles.note}>Al archivar, se cierra la comunidad para todos sus miembros.</Text>
          <AuthButton label="Archivar comunidad" icon={Archive} variant="ghost"
            disabled={!!busy} onPress={() => setConfirmArchive(true)} />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <AuthButton label="Guardar cambios" icon={Check} disabled={!canSave || !!busy}
          loading={busy === 'save'} onPress={() => void save()} />
      </View>
      <ConfirmDialog confirmation={confirmArchive ? {
        title: `¿Archivar ${initialName}?`,
        message: 'La comunidad se cerrará para todos sus miembros.',
        label: 'Archivar',
        Icon: Archive,
        destructive: true,
        onConfirm: () => void archive(),
      } : null} busy={busy === 'archive'} onCancel={() => setConfirmArchive(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  form: { gap: Spacing.two, paddingBottom: Spacing.three },
  label: { color: Brand.text, fontWeight: '700' },
  note: { color: Brand.textSecondary, fontSize: 14 },
  archive: { borderTopWidth: 1, borderTopColor: Brand.border, paddingTop: Spacing.three, marginTop: Spacing.four },
  footer: { paddingVertical: Spacing.two },
});
