import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, Users } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenState } from '@/components/common/screen-state';
import { CommunityScreen } from '@/components/communities/community-screen';
import { Brand, Spacing } from '@/constants/theme';
import { usePlan } from '@/context/plan';
import { useToast } from '@/context/toast';
import { usePaginated } from '@/hooks/use-paginated';
import { communitiesService, type CommunityAdministrationCandidate } from '@/services/communities.service';

export default function TransferAdministrationScreen() {
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const id = Number(communityId);
  const candidates = usePaginated((params, signal) => communitiesService.administrationCandidates(id, params, signal), [id], 20);
  const { showToast } = useToast();
  const { refresh } = usePlan();
  const [selection, setSelection] = useState<CommunityAdministrationCandidate | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const back = () => router.canGoBack() ? router.back() : router.replace('/social');

  async function transfer() {
    if (busy || !selection) return;
    setBusy(true);
    try {
      await communitiesService.transferAdministration(id, selection.playerId);
      void refresh();
      showToast('Administración transferida.');
      back();
    } catch {
      showToast('No pudimos transferir la administración. Revisa el plazo y elige a un miembro disponible.', 'error');
      setSelection(null);
      setConfirm(false);
      candidates.refetch();
    } finally {
      setBusy(false);
    }
  }

  return (
    <CommunityScreen title="Transferir administración" onBack={back}>
      <Text style={styles.help}>Elige a un miembro con un plan de pago vigente y cupo para administrar.</Text>
      <ScreenState loading={candidates.loading} error={candidates.error} onRetry={candidates.refetch}
        empty={candidates.data?.content.length === 0}
        emptyMessage="Aún no hay miembros para transferir la administración."
        errorMessage="No pudimos cargar los miembros disponibles." />
      {candidates.data && !candidates.loading && !candidates.error && (
        <FlatList
          data={candidates.data.content}
          keyExtractor={({ playerId }) => String(playerId)}
          contentContainerStyle={styles.list}
          ListFooterComponent={candidates.data.totalPages > 1 ? (
            <PaginationBar page={candidates.data} onPageChange={candidates.setPage} />
          ) : undefined}
          renderItem={({ item }) => {
            const selected = selection?.playerId === item.playerId;
            return (
              <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: !item.eligible }}
                disabled={!item.eligible} onPress={() => setSelection(item)} style={[styles.row, selected && styles.selected]}>
                <View style={styles.name}>
                  <Text style={styles.label}>{item.playerName}</Text>
                  <Text style={styles.help}>{item.eligible ? 'Puede administrar' : 'No disponible para administrar'}</Text>
                </View>
                {selected && <CircleCheck color="#22D3EE" size={20} />}
              </Pressable>
            );
          }}
        />
      )}
      {selection && !candidates.error && <View style={styles.footer}>
        <AuthButton label="Continuar" icon={Users} onPress={() => setConfirm(true)} />
      </View>}
      <ConfirmDialog confirmation={confirm && selection ? {
        title: '¿Transferir administración?',
        message: `${selection.playerName} administrará la comunidad. Tú seguirás como miembro.`,
        label: 'Transferir',
        Icon: Users,
        hideTitleIcon: true,
        onConfirm: () => void transfer(),
      } : null} busy={busy} onCancel={() => setConfirm(false)} />
    </CommunityScreen>
  );
}

const styles = StyleSheet.create({
  help: { color: Brand.textSecondary, fontSize: 14 },
  list: { gap: Spacing.two, paddingVertical: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 60, padding: 12,
    backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border, borderRadius: 14 },
  selected: { borderColor: '#22D3EE' },
  name: { flex: 1, gap: Spacing.one },
  label: { color: Brand.text, fontWeight: '700' },
  footer: { paddingBottom: 12 },
});
