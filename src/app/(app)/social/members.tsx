import { router, useLocalSearchParams } from 'expo-router';
import { Ellipsis, ShieldCheck, ShieldMinus, UserMinus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CommunityScreen } from '@/components/communities/community-screen';
import { ConfirmDialog, type Confirmation } from '@/components/common/confirm-dialog';
import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenState } from '@/components/common/screen-state';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { usePaginated } from '@/hooks/use-paginated';
import { communitiesService, type CommunityMember } from '@/services/communities.service';
import { toApiError } from '@/utils/api-error';

type MemberAction = 'promote' | 'demote' | 'remove';

export default function CommunityMembersScreen() {
  const { communityId: id } = useLocalSearchParams<{ communityId: string }>();
  const communityId = Number(id);
  const { player } = useSession();
  const { showToast } = useToast();
  const detail = useFetch((signal) => communitiesService.detail(communityId, signal), [communityId]);
  const members = usePaginated((params, signal) => communitiesService.members(communityId, params, signal), [communityId]);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [busy, setBusy] = useState(false);
  const community = detail.data;

  const update = async (member: CommunityMember, action: MemberAction) => {
    if (busy) return;
    setBusy(true);
    try {
      if (action === 'remove') await communitiesService.removeMember(communityId, member.playerId);
      else await communitiesService.setRole(communityId, member.playerId, action === 'promote' ? 'COMMUNITY_ADMIN' : 'MEMBER');
      showToast(action === 'remove' ? 'Miembro eliminado de la comunidad.' : 'Permisos actualizados.');
      setConfirmation(null);
      detail.refetch();
      if (action === 'remove' && members.page > 0 && members.data?.content.length === 1) {
        members.setPage(members.page - 1);
      } else {
        members.refetch();
      }
    } catch (error) {
      showToast(toApiError(error).message, 'error');
      setConfirmation(null);
      detail.refetch();
      members.refetch();
    } finally {
      setBusy(false);
    }
  };

  const confirm = (member: CommunityMember, action: MemberAction) => {
    setOpenMenu(null);
    const name = member.playerName;
    const onConfirm = () => void update(member, action);

    switch (action) {
      case 'promote':
        setConfirmation({ title: `¿Hacer administrador a ${name}?`, message: 'Podrá gestionar la comunidad y sus miembros.',
          label: 'Hacer administrador', Icon: ShieldCheck, onConfirm });
        break;
      case 'demote':
        setConfirmation({ title: `¿Quitarle los permisos de administrador a ${name}?`, message: `${name} seguirá siendo miembro.`,
          label: 'Quitar permisos', Icon: ShieldMinus, destructive: true, onConfirm });
        break;
      case 'remove':
        setConfirmation({ title: `¿Quitar a ${name} de ${community?.name ?? 'la comunidad'}?`,
          message: `${name} dejará de pertenecer a la comunidad.`, label: 'Quitar miembro', Icon: UserMinus, destructive: true, onConfirm });
        break;
    }
  };

  const canManage = community?.status === 'ACTIVE' && community.myRole === 'COMMUNITY_ADMIN';
  return (
    <CommunityScreen title="Gestionar miembros" onBack={() => router.canGoBack() ? router.back() : router.replace('/social')}>
      <ScreenState loading={detail.loading || members.loading} error={detail.error ?? members.error}
        empty={members.data?.content.length === 0} onRetry={() => { detail.refetch(); members.refetch(); }} />
      {community && <Text style={styles.caption}>{community.name} · {community.memberCount} miembros</Text>}
      {!members.loading && !members.error && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.list} onScrollBeginDrag={() => setOpenMenu(null)}>
          {members.data?.content.map((member, index, page) => {
            const open = openMenu === member.playerId;
            const admin = member.role === 'COMMUNITY_ADMIN';
            const RoleIcon = admin ? ShieldMinus : ShieldCheck;
            const roleLabel = admin ? 'Quitar permisos' : 'Hacer administrador';
            return (
              <View key={member.playerId} style={open && styles.openRow}>
                <View style={styles.row}>
                  <Text style={styles.avatar}>{member.playerName.trim().slice(0, 2).toLocaleUpperCase('es')}</Text>
                  <View style={styles.identity}>
                    <Text style={styles.name}>{member.playerName}</Text>
                    <Text style={styles.role}>{admin ? 'Administrador' : 'Miembro'}</Text>
                  </View>
                  {canManage && member.playerId !== player?.id && (
                    <Pressable style={styles.menuTrigger} accessibilityRole="button" accessibilityLabel={`Acciones de ${member.playerName}`}
                      accessibilityState={{ expanded: open }} onPress={() => setOpenMenu(open ? null : member.playerId)}>
                      <Ellipsis size={20} color={Brand.text} />
                    </Pressable>
                  )}
                </View>
                {open && canManage && (
                  <View style={[styles.menu, index === page.length - 1 ? styles.above : styles.below]}>
                    <Pressable accessibilityRole="button" style={styles.menuItem} onPress={() => confirm(member, admin ? 'demote' : 'promote')}>
                      <RoleIcon size={18} color={Brand.text} /><Text style={styles.name}>{roleLabel}</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" style={styles.menuItem} onPress={() => confirm(member, 'remove')}>
                      <UserMinus size={18} color="#FF4A52" /><Text style={styles.danger}>Quitar miembro</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
          {members.data && members.data.totalPages > 1 && <PaginationBar page={members.data} onPageChange={(page) => { setOpenMenu(null); members.setPage(page); }} />}
        </ScrollView>
      )}
      <ConfirmDialog confirmation={confirmation} busy={busy} onCancel={() => setConfirmation(null)} />
    </CommunityScreen>
  );
}

const styles = StyleSheet.create({
  caption: { color: Brand.textSecondary, marginBottom: Spacing.two },
  scroll: { flex: 1 },
  list: { gap: Spacing.two, paddingVertical: Spacing.two },
  openRow: { zIndex: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, backgroundColor: Brand.surface, borderRadius: Spacing.three },
  avatar: { color: '#22D3EE', minWidth: 42, textAlign: 'center', padding: 10, fontWeight: '800', backgroundColor: '#222226', borderRadius: 10, overflow: 'hidden' },
  identity: { flex: 1 },
  name: { color: Brand.text, fontSize: 15, fontWeight: '600', flexShrink: 1 },
  role: { color: '#22D3EE', fontSize: 13 },
  menuTrigger: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  menu: { position: 'absolute', right: Spacing.two, width: 228, maxWidth: '95%', padding: Spacing.one, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface, borderRadius: 14, elevation: 6 },
  above: { bottom: '90%' },
  below: { top: '90%' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 44, paddingHorizontal: Spacing.two },
  danger: { color: '#FF4A52', fontSize: 15, fontWeight: '600' },
});
