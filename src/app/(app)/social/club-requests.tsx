import { router, useFocusEffect } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ConfirmDialog, type Confirmation } from '@/components/common/confirm-dialog';
import { ScreenState } from '@/components/common/screen-state';
import { ClubCard } from '@/components/clubs/club-card';
import { CommunityScreen } from '@/components/communities/community-screen';
import { PongiState, pongiArt } from '@/components/pongmigos/pongmigos-ui';
import { Brand, Spacing } from '@/constants/theme';
import { usePlan } from '@/context/plan';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { clubsService, type ClubMembership } from '@/services/clubs.service';

const labels = { PENDING: 'Pendiente', REJECTED: 'Rechazada', CANCELLED: 'Cancelada' } as const;

export default function ClubRequestsScreen() {
  const { player } = useSession();
  const { refresh } = usePlan();
  const { showToast } = useToast();
  const requests = useFetch(async (signal) => {
    const memberships = player ? await clubsService.memberships(player.id, signal, true) : [];
    return memberships.filter((item) => item.role === 'MEMBER' && item.status in labels);
  }, [player?.id]);
  useFocusEffect(requests.refetch);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  function confirmCancel(item: ClubMembership) {
    setConfirmation({
      title: '¿Cancelar solicitud?',
      message: item.clubName,
      label: 'Cancelar solicitud',
      cancelLabel: 'Volver',
      Icon: X,
      onConfirm: async () => {
        if (busy) return;
        setBusy(true);
        try {
          await clubsService.cancelMembership(item.id);
          setConfirmation(null);
          requests.refetch();
          void refresh();
        } catch {
          showToast('No pudimos cancelar la solicitud.', 'error');
        } finally {
          setBusy(false);
        }
      },
    });
  }

  return (
    <CommunityScreen title="Solicitudes enviadas" onBack={() => router.canGoBack() ? router.back() : router.replace('/social')}>
      {requests.error?.isNetwork ? (
        <View style={styles.centered}><PongiState error={requests.error} errorMessage="No pudimos conectar con PongRank." retry={requests.refetch} /></View>
      ) : <ScreenState loading={requests.loading} error={requests.error} errorMessage="No pudimos cargar las solicitudes." onRetry={requests.refetch} />}
      {!requests.loading && !requests.error && (
        <FlatList data={requests.data ?? []} keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, !requests.data?.length && styles.centered]}
          ListEmptyComponent={<PongiState artwork={pongiArt.cancelled} text="No tienes solicitudes enviadas." />}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <ClubCard name={item.clubName} description={labels[item.status as keyof typeof labels]}
                onPress={() => router.push({ pathname: '/social/club', params: { id: item.clubId } })} />
              {item.status === 'PENDING' && (
                <AuthButton label="Cancelar solicitud" icon={X} onPress={() => confirmCancel(item)} />
              )}
            </View>
          )}
        />
      )}
      <ConfirmDialog confirmation={confirmation} busy={busy} onCancel={() => setConfirmation(null)} />
    </CommunityScreen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three, paddingVertical: 12 },
  item: { gap: Spacing.two },
  centered: { flexGrow: 1, justifyContent: 'center', backgroundColor: Brand.background },
});
