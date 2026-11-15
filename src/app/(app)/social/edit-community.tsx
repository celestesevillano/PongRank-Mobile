import { router, useLocalSearchParams } from 'expo-router';
import { Check, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { CommunityCard } from '@/components/communities/community-card';
import { CommunityTypeFields } from '@/components/communities/community-form';
import { CommunityScreen } from '@/components/communities/community-screen';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ScreenState } from '@/components/common/screen-state';
import { Brand, Spacing } from '@/constants/theme';
import { usePlan } from '@/context/plan';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { communitiesService, type CommunityDetail } from '@/services/communities.service';
import { toApiError } from '@/utils/api-error';

export default function EditCommunityScreen() {
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const id = Number(communityId);
  const detail = useFetch((signal) => communitiesService.detail(id, signal), [id]);
  const community = detail.data;
  const onBack = () => router.canGoBack() ? router.back() : router.replace('/social');

  if (!detail.loading && !detail.error && community?.status === 'ACTIVE' && community.lifecyclePhase !== 'GRACE' && community.myRole === 'COMMUNITY_ADMIN') {
    return <EditForm key={id} community={community} onBack={onBack} />;
  }

  return (
    <CommunityScreen title="Editar comunidad" onBack={onBack}>
      <ScreenState loading={detail.loading} error={detail.error} onRetry={detail.refetch} />
      {!detail.loading && !detail.error && community && (
        <Text style={styles.note}>Esta comunidad ya no está disponible para edición.</Text>
      )}
    </CommunityScreen>
  );
}

function EditForm({ community, onBack }: { community: CommunityDetail; onBack: () => void }) {
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description ?? '');
  const [type, setType] = useState(community.communityType);
  const [customLabel, setCustomLabel] = useState(community.customLabel ?? '');
  const [dialog, setDialog] = useState<'confirm' | 'success' | null>(null);
  const [busy, setBusy] = useState<'save' | 'archive' | null>(null);
  const { refresh } = usePlan();
  const { showToast } = useToast();
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const label = type === 'OTHER' ? customLabel.trim() : undefined;
  const typeChanged = type !== community.communityType || label !== (community.customLabel?.trim() || undefined);
  const canSave = trimmedName.length >= 3 && (type !== 'OTHER' || !!label)
    && (trimmedName !== community.name.trim() || trimmedDescription !== (community.description ?? '').trim() || typeChanged);

  async function save() {
    if (busy || !canSave) return;
    setBusy('save');
    try {
      await communitiesService.update(community.id, {
        name: trimmedName,
        description: trimmedDescription,
        ...(typeChanged ? { communityType: type, customLabel: label } : {}),
      });
      showToast('Cambios guardados.');
      onBack();
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
      await communitiesService.archive(community.id);
      void refresh();
      setDialog('success');
    } catch (error) {
      showToast(toApiError(error).message, 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <CommunityScreen title="Editar comunidad" onBack={onBack} action={(
      <Pressable accessibilityRole="button" accessibilityLabel="Eliminar comunidad" disabled={!!busy}
        style={({ pressed }) => [styles.deleteButton, (pressed || busy) && styles.muted]} onPress={() => setDialog('confirm')}>
        <Trash2 size={20} color="#FF6B72" />
      </Pressable>
    )}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nombre</Text>
        <AuthInput accessibilityLabel="Nombre" value={name} onChangeText={setName} maxLength={120} editable={!busy} />
        {trimmedName.length < 3 && <Text style={styles.note}>Escribe al menos 3 caracteres.</Text>}
        <Text style={styles.label}>Descripción</Text>
        <AuthInput accessibilityLabel="Descripción" value={description} onChangeText={setDescription}
          maxLength={500} multiline editable={!busy} />
        <CommunityTypeFields type={type} onTypeChange={setType} customLabel={customLabel} onLabelChange={setCustomLabel}
          includePark={community.communityType === 'PUBLIC_PARK'} disabled={!!busy} />
        {trimmedName.length >= 3 && (
          <>
            <Text accessibilityRole="header" style={styles.label}>Vista previa</Text>
            <CommunityCard featured creatorName={community.creatorName} community={{
              ...community, name: trimmedName, description: trimmedDescription, communityType: type, customLabel: label,
            }} />
          </>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <AuthButton label="Guardar cambios" icon={Check} disabled={!canSave || !!busy}
          loading={busy === 'save'} onPress={() => void save()} />
      </View>
      <ConfirmDialog confirmation={dialog === 'confirm' ? {
        hideTitleIcon: true,
        title: '¿Eliminar comunidad?',
        message: 'Se cerrará para todos sus miembros.',
        label: 'Eliminar',
        Icon: Trash2,
        destructive: true,
        onConfirm: () => void archive(),
      } : dialog === 'success' ? {
        title: 'Comunidad eliminada',
        message: `Se cerró «${community.name}».`,
        label: 'Aceptar',
        Icon: Check,
        infoOnly: true,
        success: true,
        onConfirm: () => router.dismissTo('/social'),
      } : null} busy={busy === 'archive'} onCancel={() => {
        if (dialog === 'success') router.dismissTo('/social');
        else setDialog(null);
      }} />
    </CommunityScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  form: { gap: Spacing.two, paddingBottom: Spacing.three },
  label: { color: Brand.text, fontWeight: '700' },
  note: { color: Brand.textSecondary, fontSize: 14 },
  deleteButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  muted: { opacity: 0.6 },
  footer: { paddingTop: Spacing.two, paddingBottom: 12 },
});
