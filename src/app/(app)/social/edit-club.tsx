import { router, useLocalSearchParams } from 'expo-router';
import { Check, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { ClubNotice } from '@/components/clubs/club-notice';
import { AddressField } from '@/components/clubs/address-field';
import { ClubCard } from '@/components/clubs/club-card';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { usePlan } from '@/context/plan';
import { ScreenState } from '@/components/common/screen-state';
import { CommunityScreen } from '@/components/communities/community-screen';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { clubsService, type Club, type ClubReview } from '@/services/clubs.service';
import { toApiError } from '@/utils/api-error';

const goBack = () => router.canGoBack() ? router.back() : router.replace('/social');

export default function EditClubScreen() {
  const { id, correcting } = useLocalSearchParams<{ id: string; correcting?: string }>();
  const { player } = useSession();
  const club = useFetch((signal) => correcting ? clubsService.review(Number(id), signal) : clubsService.detail(Number(id), signal), [id, correcting]);

  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const { refresh } = usePlan();
  const canDelete = !!player && club.data?.admin?.id === player.id && club.data.status !== 'DELETED';
  const remove = async () => {
    if (deleting || !canDelete) return;
    setDeleting(true);
    try {
      await clubsService.remove(Number(id));
      setConfirmDelete(false);
      void refresh();
      goBack();
    } catch {
      setConfirmDelete(false);
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <CommunityScreen title={correcting ? "Corregir información" : "Editar club"} onBack={goBack} action={canDelete &&
      <Pressable style={styles.remove} accessibilityRole="button" accessibilityLabel="Eliminar club" onPress={() => {
        setDeleteError(false);
        setConfirmDelete(true);
      }}>
        <Trash2 color={Brand.red} size={20} />
      </Pressable>}>
      {deleteError && <Text accessibilityRole="alert" style={styles.error}>No pudimos eliminar el club.</Text>}
      <ScreenState loading={club.loading} error={club.error} errorMessage="No pudimos cargar el club." onRetry={club.refetch} />
      {!club.loading && !club.error && club.data && (
        club.data.admin?.id === player?.id && !!player
          ? <EditForm key={club.data.id} club={club.data} />
          : <Text style={styles.note}>Solo la persona administradora puede editar el club.</Text>
      )}
      <ConfirmDialog busy={deleting} onCancel={() => setConfirmDelete(false)} confirmation={confirmDelete ? {
        title: '¿Eliminar club?', message: 'El club se cerrará para todos sus miembros.',
        label: 'Eliminar', Icon: Trash2, destructive: true, onConfirm: remove,
      } : null} />
    </CommunityScreen>
  );
}

function EditForm({ club }: { club: Club }) {
  const [name, setName] = useState(club.name);
  const [address, setAddress] = useState(club.address);
  const review = 'affiliationDocumentUrl' in club ? club as ClubReview : null;
  const [description, setDescription] = useState(club.description ?? '');
  const [document, setDocument] = useState(review?.affiliationDocumentUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = name.trim().length > 0 && address.trim().length > 0 && (!review || !!document.trim());
  const changed = name.trim() !== club.name || address.trim() !== club.address
    || description.trim() !== (club.description ?? '') || !!review;

  async function save() {
    if (!valid || !changed || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (name.trim() !== club.name || address.trim() !== club.address || description.trim() !== (club.description ?? '')) {
        await clubsService.update(club.id, { name: name.trim(), address: address.trim(), description: description.trim() });
      }
      if (review) await clubsService.resubmit(club.id, document.trim());
      goBack();
    } catch (failure) {
      setError(toApiError(failure).status === 409 ? 'Ese nombre ya está en uso.' : 'No pudimos guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.layout} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {review && <ClubNotice title="Observación de PongRank" message={review.rejectionReason} />}
        <Text style={styles.label}>Nombre</Text>
        <AuthInput accessibilityLabel="Nombre del club" value={name} onChangeText={setName} editable={!saving} maxLength={150} />
        <Text style={styles.label}>Dirección</Text>
        <AddressField value={address} onChange={setAddress} />
        {!review && <>
          <Text style={styles.label}>Descripción</Text>
          <AuthInput accessibilityLabel="Descripción del club" value={description} onChangeText={setDescription}
            multiline maxLength={500} editable={!saving} />
        </>}
        {review && <>
          <Text style={styles.label}>Enlace al documento de afiliación a la FDPTM</Text>
          <AuthInput accessibilityLabel="Documento de afiliación" value={document} onChangeText={setDocument}
            autoCapitalize="none" keyboardType="url" editable={!saving} maxLength={500} />
        </>}
        {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        {valid && (
          <>
            <Text accessibilityRole="header" style={styles.label}>Vista previa</Text>
            <ClubCard name={name.trim()} description={address.trim()} featured role="admin"
              memberCount={club.memberCount} creatorName={club.creatorName} />
          </>
        )}
      </ScrollView>
      <AuthButton label={review ? "Reenviar a revisión" : "Guardar cambios"} icon={Check} disabled={!valid || !changed} loading={saving} onPress={() => void save()} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  remove: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  layout: { flex: 1, paddingBottom: 12 },
  form: { gap: Spacing.two, paddingBottom: Spacing.three },
  label: { color: Brand.text, fontWeight: '700' },
  note: { color: Brand.textSecondary, fontSize: 14 },
  error: { color: '#FF8085', fontSize: 14 },
});
