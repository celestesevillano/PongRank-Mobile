import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Archive, ArrowLeft, Layers, LayoutGrid, LogOut, Trophy, UserPlus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { CommunityCard } from '@/components/communities/community-card';
import { CommunityScreen } from '@/components/communities/community-screen';
import { RankingPosition } from '@/components/communities/ranking-position';
import { ConfirmDialog, type Confirmation } from '@/components/common/confirm-dialog';
import { ScreenState } from '@/components/common/screen-state';
import { Brand, Spacing } from '@/constants/theme';
import { usePlan } from '@/context/plan';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { communitiesService } from '@/services/communities.service';
import { toApiError } from '@/utils/api-error';

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const communityId = Number(id);
  const { plan, openPlans, refresh } = usePlan();
  const { player } = useSession();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const detail = useFetch((signal) => communitiesService.detail(communityId, signal), [communityId]);
  const ranking = useFetch((signal) => communitiesService.ranking(communityId, { size: 3 }, signal), [communityId]);
  const mine = useFetch((signal) => communitiesService.mine(signal), []);
  useFocusEffect(detail.refetch);
  const community = detail.data;
  const limit = plan?.maxSpaces ?? plan?.maxCommunitiesTotal;
  const used = plan?.usedSpaces ?? mine.data?.length;
  const full = limit !== undefined && used !== undefined && used >= limit;
  const openMembers = () => router.push({ pathname: '/social/members', params: { communityId } });

  const changeMembership = async (action: 'join' | 'leave' | 'archive') => {
    if (busy || !community || !player) return;
    setBusy(true);
    try {
      if (action === 'join') await communitiesService.join(communityId);
      else if (action === 'archive') await communitiesService.archive(communityId);
      else await communitiesService.removeMember(communityId, player.id);
      showToast(action === 'join' ? `Ya eres parte de ${community.name}.` : action === 'archive' ? 'Comunidad archivada.' : `Saliste de ${community.name}.`);
      setConfirmation(null);
      void refresh();
      router.dismissTo('/social');
    } catch (err) {
      setConfirmation(null);
      showToast(toApiError(err).message, 'error');
      void refresh();
      detail.refetch();
      mine.refetch();
    } finally {
      setBusy(false);
    }
  };

  const confirmLeave = () => {
    if (!community) return;
    if (community.memberCount > 1 && community.myRole === 'COMMUNITY_ADMIN' && community.adminCount === 1) {
      setConfirmation({
        title: 'Asigna otro administrador',
        message: 'Antes de salir, elige a otro miembro para administrar la comunidad.',
        label: 'Ver miembros',
        cancelLabel: 'Volver',
        Icon: Users,
        onConfirm: () => { setConfirmation(null); openMembers(); },
      });
      return;
    }
    const last = community.memberCount === 1;
    setConfirmation({
      title: last ? `¿Salir y archivar ${community.name}?` : `¿Salir de ${community.name}?`,
      message: last ? 'Eres la última persona. Al salir, la comunidad se cerrará.' : 'Saldrás del ranking y liberarás un cupo.',
      label: last ? 'Salir y archivar' : 'Salir',
      Icon: last ? Archive : LogOut,
      destructive: true,
      onConfirm: () => void changeMembership('leave'),
    });
  };

  return (
    <CommunityScreen title="Comunidad" onBack={() => router.canGoBack() ? router.back() : router.replace('/social')}>
      <ScreenState loading={detail.loading} error={detail.error} onRetry={detail.refetch} />
      {!detail.loading && !detail.error && community?.status === 'ARCHIVED' && (
        <View style={styles.actions}>
          <Text style={styles.heading}>Comunidad cerrada</Text>
          <Text style={styles.description}>{community.name} fue archivada.</Text>
          <AuthButton label="Volver a Mis comunidades" icon={ArrowLeft} onPress={() => router.dismissTo('/social')} />
        </View>
      )}
      {!detail.loading && !detail.error && community && community.status !== 'ARCHIVED' && (
        <>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <CommunityCard community={community} featured />
            {community.creatorName && <Text style={styles.meta}>Creada por {community.creatorName}</Text>}
            {community.description && <Text style={styles.description}>{community.description}</Text>}
            {community.isMember && <Text style={styles.member}>Eres miembro</Text>}
            <Text style={styles.heading}>Top 3 de la comunidad</Text>
            <ScreenState loading={ranking.loading} error={ranking.error} empty={ranking.data?.content.length === 0}
              emptyMessage="Aún no hay jugadores en el ranking." onRetry={ranking.refetch} />
            {!ranking.loading && !ranking.error && ranking.data?.content.map((entry) => (
              <View key={entry.playerId} style={styles.row}>
                <RankingPosition position={entry.position} />
                <Text style={styles.player}>{entry.playerName}</Text>
                <Text style={styles.rating}>{Math.round(entry.ratingGlicko)}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            {community.isMember ? (
              <>
                <AuthButton label="Ver ranking" icon={Trophy} onPress={() => router.navigate({ pathname: '/ranking', params: { communityId } })} />
                <View style={styles.secondary}>
                  {community.myRole === 'COMMUNITY_ADMIN' && <AuthButton label="Ver miembros" icon={Users} variant="ghost" style={styles.half} onPress={openMembers} />}
                  <AuthButton label="Salir" accessibilityLabel="Salir de la comunidad" icon={LogOut} variant="ghost" style={styles.half} disabled={busy} onPress={confirmLeave} />
                </View>
                {community.myRole === 'COMMUNITY_ADMIN' && <AuthButton label="Archivar comunidad" icon={Archive} variant="ghost" disabled={busy} onPress={() => setConfirmation({
                  title: `¿Archivar ${community.name}?`,
                  message: 'La comunidad se cerrará para todos sus miembros.',
                  label: 'Archivar',
                  Icon: Archive,
                  destructive: true,
                  onConfirm: () => void changeMembership('archive'),
                })} />}
              </>
            ) : full ? (
              <>
                <Text style={styles.meta}>Sin cupos disponibles · {used} de {limit} espacios</Text>
                <AuthButton label="Ver planes" icon={Layers} onPress={openPlans} />
                <AuthButton label="Gestionar mis espacios" icon={LayoutGrid} variant="ghost" onPress={() => router.dismissTo('/social')} />
              </>
            ) : (
              <AuthButton label="Unirme a la comunidad" icon={UserPlus} loading={busy} onPress={() => void changeMembership('join')} />
            )}
          </View>
        </>
      )}
      <ConfirmDialog confirmation={confirmation} busy={busy} onCancel={() => setConfirmation(null)} />
    </CommunityScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  secondary: { flexDirection: 'row', gap: Spacing.two },
  half: { flex: 1 },
  content: { gap: Spacing.two, paddingBottom: Spacing.three },
  actions: { gap: Spacing.two, paddingVertical: Spacing.two },
  meta: { color: Brand.textSecondary, fontSize: 13 },
  description: { color: Brand.text, fontSize: 16, lineHeight: 23 },
  member: { color: '#2ECC71', fontWeight: '700' },
  heading: { color: Brand.text, fontSize: 18, fontWeight: '700', marginTop: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, borderRadius: 12, backgroundColor: Brand.surface },
  player: { color: Brand.text, flex: 1 },
  rating: { color: '#22D3EE', fontWeight: '700' },
});
