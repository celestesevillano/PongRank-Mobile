import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Archive, ArrowLeft, Check, Layers, LogOut, Pencil, RotateCw, Trophy, UserPlus, Users } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ActionRow } from '@/components/common/action-row';
import { CommunityCard } from '@/components/communities/community-card';
import { COMMUNITY_EXPIRY_WARNING, CommunityDeadline, useCommunityDeadline } from '@/components/communities/community-deadline';
import { CommunityScreen } from '@/components/communities/community-screen';
import { RankingPosition } from '@/components/communities/ranking-position';
import { ConfirmDialog, type Confirmation } from '@/components/common/confirm-dialog';
import { PongiState } from '@/components/pongmigos/pongmigos-ui';
import { ScreenState } from '@/components/common/screen-state';
import { Brand, Spacing } from '@/constants/theme';
import { usePlan } from '@/context/plan';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { communitiesService } from '@/services/communities.service';
import { toApiError } from '@/utils/api-error';

const rankyPause = require('../../../../assets/images/ranky-gestion-pausada.webp');
const deletedArtwork = require('../../../../assets/images/pongi-comunidad-eliminada.webp');

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
  const refetchDetail = detail.refetch;
  useFocusEffect(useCallback(() => {
    refetchDetail();
  }, [refetchDetail, plan?.plan, plan?.endDate]));
  const community = detail.data;
  const phase = community?.lifecyclePhase ?? community?.status;
  const grace = phase === 'GRACE';
  const closed = phase === 'DELETED' || phase === 'ARCHIVED';
  const canRenew = !!community?.planExpiresAt;
  const deadline = grace ? community?.graceEndsAt : !closed ? community?.planExpiresAt : null;
  const remaining = useCommunityDeadline(deadline, community?.serverTime, detail.refetch);
  const renewalWarning = !grace && !closed && remaining !== null && remaining <= COMMUNITY_EXPIRY_WARNING;
  const backToCommunities = () => router.dismissTo('/social');
  const openTransfer = () => router.push({ pathname: '/social/transfer-administration', params: { communityId } });
  const limit = plan?.maxSpaces ?? plan?.maxCommunitiesTotal;
  const used = plan?.usedSpaces ?? mine.data?.length;
  const full = limit !== undefined && used !== undefined && used >= limit;
  const openMembers = () => router.push({ pathname: '/social/members', params: { communityId } });

  const changeMembership = async (action: 'join' | 'leave') => {
    if (busy || !community || !player) return;
    setBusy(true);
    try {
      if (action === 'join') await communitiesService.join(communityId);
      else await communitiesService.removeMember(communityId, player.id);
      void refresh();
      if (action === 'join') {
        detail.refetch();
        ranking.refetch();
        setConfirmation({
          title: 'Ya eres parte del grupo', message: `Te uniste a ${community.name}.`,
          label: 'Aceptar', Icon: Check, infoOnly: true, success: true,
          onConfirm: () => setConfirmation(null),
        });
      } else {
        showToast(`Saliste de ${community.name}.`);
        setConfirmation(null);
        router.dismissTo('/social');
      }
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
    if (community.memberCount > 1 && community.canTransferAdministration) {
      setConfirmation({
        hideTitleIcon: true,
        title: 'Transfiere la administración',
        message: 'Elige a la persona responsable antes de salir.',
        label: 'Elegir miembro',
        Icon: Users,
        onConfirm: () => { setConfirmation(null); openTransfer(); },
      });
      return;
    }
    if (community.memberCount > 1 && community.myRole === 'COMMUNITY_ADMIN' && community.adminCount === 1) {
      setConfirmation({
        hideTitleIcon: true,
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
      hideTitleIcon: true,
      title: last ? `¿Salir y eliminar ${community.name}?` : `¿Salir de ${community.name}?`,
      message: last ? 'Eres la última persona. Al salir, la comunidad se cerrará.' : 'Saldrás del ranking y liberarás un cupo.',
      label: last ? 'Salir y eliminar' : 'Salir',
      Icon: last ? Archive : LogOut,
      destructive: true,
      onConfirm: () => void changeMembership('leave'),
    });
  };

  // Mientras se refresca el detalle se conserva el contenido anterior: así el popup de éxito no queda sobre una pantalla que parece reiniciarse.
  const activeCommunity = !detail.error && community?.status === 'ACTIVE' ? community : null;
  const canEdit = !grace && activeCommunity?.myRole === 'COMMUNITY_ADMIN';
  const canLeave = activeCommunity?.isMember && !grace;
  const pausedForAdmin = !!activeCommunity && grace && canRenew;

  return (
    <>
    <CommunityScreen title="Comunidad" scrollable={activeCommunity !== null && !pausedForAdmin} onBack={() => router.canGoBack() ? router.back() : router.replace('/social')}
      action={(
        <View style={styles.toolbarActions}>
          {canEdit && (
            <Pressable accessibilityRole="button" accessibilityLabel="Editar comunidad" style={styles.iconButton}
              onPress={() => router.push({ pathname: '/social/edit-community', params: { communityId } })}>
              <Pencil color={Brand.text} size={20} />
            </Pressable>
          )}
          {canLeave && (
            <Pressable accessibilityRole="button" accessibilityLabel="Salir de la comunidad"
              accessibilityHint="Abre un diálogo de confirmación" disabled={busy}
              style={({ pressed }) => [styles.iconButton, (pressed || busy) && styles.iconMuted]} onPress={confirmLeave}>
              <LogOut color={Brand.text} size={20} />
            </Pressable>
          )}
        </View>
      )}>
      {detail.error ? (
        <View style={styles.centeredState}>
          <PongiState error={detail.error} errorMessage={detail.error.isNetwork ? 'No pudimos conectar con PongRank.' : 'No pudimos cargar la comunidad.'} retry={detail.refetch} />
        </View>
      ) : <ScreenState loading={detail.loading && !community} error={null} />}
      {!detail.error && community && closed && (
        <View style={styles.centeredState}>
          <PongiState
            artwork={deletedArtwork}
            title="Comunidad eliminada"
            contextLabel={community.name}
            text={community.myRole === 'COMMUNITY_ADMIN' ? 'Se liberaron los cupos.' : 'Tu cupo ya está disponible.'}
            action={{ label: 'Volver a Mis comunidades', icon: ArrowLeft, onPress: backToCommunities }}
          />
        </View>
      )}
      {pausedForAdmin && community && (
        <View style={[styles.centeredState, styles.pausedPanel]}>
          <Text style={styles.pausedTitle} accessibilityRole="header">Gestión pausada</Text>
          <Text style={styles.meta}>{community.name}</Text>
          {remaining !== null && (
            <View style={[styles.expiryPill, styles.pausedTimer]}>
              <Image source={rankyPause} contentFit="contain" style={styles.rankyPause}
                accessibilityElementsHidden importantForAccessibility="no" />
              <View style={styles.pausedCountdown}>
                <CommunityDeadline title="Hasta el cierre" remaining={remaining} variant="prominent" />
              </View>
            </View>
          )}
          <ActionRow>
            <AuthButton label="Renovar plan" icon={Layers} onPress={openPlans} />
            {!!community.canTransferAdministration && (
              <AuthButton label="Transferir" variant="secondary" onPress={openTransfer} />
            )}
          </ActionRow>
        </View>
      )}
      {activeCommunity && community && !pausedForAdmin && (
        <View style={styles.content}>
          {renewalWarning && remaining !== null && (
            <View style={styles.expiryPill}>
              <CommunityDeadline title="Tu plan vence en" remaining={remaining} />
              <ActionRow>
                <AuthButton label="Renovar plan" icon={Layers} onPress={openPlans} />
                {!!community.canTransferAdministration && (
                  <AuthButton label="Transferir" variant="secondary" onPress={openTransfer} />
                )}
              </ActionRow>
            </View>
          )}
          <CommunityCard community={community} featured creatorName={community.creatorName}
            isMember={community.isMember} isAdmin={community.myRole === 'COMMUNITY_ADMIN'} />
          {!!community.description && (
            <View style={styles.about}>
              <Text style={styles.heading}>Sobre la comunidad</Text>
              <Text style={styles.description}>{community.description}</Text>
            </View>
          )}
          <View style={styles.podium}>
            <View style={styles.podiumHeader}>
              <Trophy color="#FFD278" size={20} />
              <Text accessibilityRole="header" style={styles.podiumTitle}>Top 3 de la comunidad</Text>
            </View>
            <ScreenState loading={ranking.loading && !ranking.data} error={ranking.error} empty={ranking.data?.content.length === 0}
              emptyMessage="Aún no hay jugadores en el ranking." errorMessage="No pudimos cargar el ranking."
              onRetry={ranking.refetch} retryIcon={RotateCw} />
            {!ranking.error && ranking.data?.content.map((entry) => (
              <View key={entry.playerId} style={[styles.row, entry.position === 1 && styles.firstRow]}>
                <RankingPosition position={entry.position} />
                <Text style={styles.player}>{entry.playerName}</Text>
                <Text style={[styles.rating, entry.position === 1 && styles.firstRating]}>{Math.round(entry.ratingGlicko)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.actions}>
            {grace && !community.isMember ? (
              <Text style={styles.meta}>Esta comunidad está en pausa por vencimiento de su plan y no admite nuevos miembros por ahora.</Text>
            ) : community.isMember ? (
              <>
                <ActionRow>
                  {!grace && community.myRole === 'COMMUNITY_ADMIN' && <AuthButton label="Ver miembros" variant="secondary" onPress={openMembers} />}
                  <AuthButton label="Ver ranking" icon={Trophy}
                    onPress={() => router.navigate({ pathname: '/ranking', params: { communityId } })} />
                </ActionRow>
              </>
            ) : full ? (
              <>
                <Text style={styles.meta}>Sin cupos disponibles · {used} de {limit} espacios</Text>
                <ActionRow>
                  <AuthButton label="Mis espacios" variant="secondary" onPress={() => router.dismissTo('/social')} />
                  <AuthButton label="Ver planes" icon={Layers} onPress={openPlans} />
                </ActionRow>
              </>
            ) : (
              <AuthButton label="Unirme a la comunidad" icon={UserPlus} loading={busy} onPress={() => void changeMembership('join')} />
            )}
          </View>
        </View>
      )}
    </CommunityScreen>
    {/* Fuera de CommunityScreen: al refrescar el detalle esa pantalla cambia de estructura y desmontaba el popup. */}
    <ConfirmDialog confirmation={confirmation} busy={busy} onCancel={() => setConfirmation(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  toolbarActions: { flexDirection: 'row', gap: Spacing.one },
  iconMuted: { opacity: 0.6 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  centeredState: { flex: 1, justifyContent: 'center' },
  expiryPill: { gap: Spacing.two, alignSelf: 'stretch', padding: 12, borderWidth: 1, borderColor: '#FFD27875',
    backgroundColor: '#FFD27814', borderRadius: 14 },
  pausedPanel: { gap: Spacing.two },
  pausedTitle: { color: Brand.text, fontSize: 26, fontWeight: '800' },
  pausedTimer: { marginTop: Spacing.two, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', padding: 12 },
  rankyPause: { width: 120, height: 120, alignSelf: 'center' },
  pausedCountdown: { flexGrow: 1, flexBasis: 144 },
  about: { gap: Spacing.two },
  content: { gap: Spacing.two, paddingBottom: 12 },
  actions: { gap: Spacing.two, paddingTop: Spacing.two },
  meta: { color: Brand.textSecondary, fontSize: 13 },
  description: { color: Brand.text, fontSize: 16, lineHeight: 23 },
  heading: { color: Brand.text, fontSize: 18, fontWeight: '700', marginTop: Spacing.two },
  podium: {
    marginTop: Spacing.two, borderRadius: 14, borderWidth: 1, borderColor: '#FFD27866',
    backgroundColor: Brand.surface, boxShadow: '0 0 12px #FFD27826',
  },
  podiumHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three,
    borderTopLeftRadius: 13, borderTopRightRadius: 13, backgroundColor: '#FFD27812',
  },
  podiumTitle: { color: Brand.text, fontSize: 18, fontWeight: '800', flex: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 46,
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Brand.border,
  },
  firstRow: { backgroundColor: '#FFD2780D' },
  player: { color: Brand.text, flex: 1, fontWeight: '600' },
  rating: { color: '#22D3EE', fontWeight: '700', fontVariant: ['tabular-nums'] },
  firstRating: { color: '#FFD278', fontSize: 18, fontWeight: '800' },
});
