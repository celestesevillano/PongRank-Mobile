import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ChartNoAxesColumnIncreasing, ChevronRight, Clock3, GitFork, Layers, LogOut, Megaphone, Pencil, Send, Trophy, UserPlus, Users, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ActionRow } from '@/components/common/action-row';
import { ClubNotice } from '@/components/clubs/club-notice';
import { ClubAbout, ClubCard } from '@/components/clubs/club-card';
import { ConfirmDialog, type Confirmation } from '@/components/common/confirm-dialog';
import { ScreenState } from '@/components/common/screen-state';
import { CommunityScreen } from '@/components/communities/community-screen';
import { PongiState } from '@/components/pongmigos/pongmigos-ui';
import { ClubError } from '@/components/clubs/club-error';
import { Brand, Spacing } from '@/constants/theme';
import { usePlan } from '@/context/plan';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { clubsService } from '@/services/clubs.service';

type MembershipAction = 'join' | 'cancel' | 'leave';

export default function ClubDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clubId = Number(id);
  const { player } = useSession();
  const { plan, openPlans, refresh } = usePlan();
  const { showToast } = useToast();
  const club = useFetch((signal) => clubsService.detail(clubId, signal), [clubId]);
  const memberships = useFetch((signal) => player ? clubsService.memberships(player.id, signal, true) : Promise.resolve([]), [player?.id]);

  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const history = memberships.data?.filter((item) => item.clubId === clubId);
  const membership = history?.find(({ status }) => status === 'APPROVED' || status === 'PENDING') ?? history?.[0];
  const isAdmin = !!player && club.data?.admin?.id === player.id;
  const isMember = membership?.status === 'APPROVED';
  const isApproved = club.data?.status === 'APPROVED';
  const canEnter = isApproved && (isAdmin || isMember);
  const pending = useFetch((signal) => isAdmin && isApproved
    ? clubsService.people(clubId, 'pending', { page: 0, size: 1 }, signal)
    : Promise.resolve(null), [clubId, isAdmin, isApproved]);
  const members = useFetch((signal) => isApproved
    ? clubsService.allMembers(clubId, signal)
    : Promise.resolve(null), [clubId, isApproved]);
  const top = (members.data ?? []).flatMap(({ player }) => player ? [player] : [])
    .sort((a, b) => b.ratingGlicko - a.ratingGlicko || a.id - b.id).slice(0, 3);
  const refreshClub = club.refetch;
  const refreshMemberships = memberships.refetch;
  const refreshPending = pending.refetch;
  const refreshMembers = members.refetch;
  useFocusEffect(useCallback(() => {
    refreshClub();
    refreshMemberships();
    refreshPending();
    refreshMembers();
  }, [refreshClub, refreshMemberships, refreshPending, refreshMembers]));

  const endDate = club.data?.planExpiresAt ?? plan?.endDate;
  const planEnds = endDate ? Date.parse(endDate) : NaN;
  const hoursLeft = Math.ceil((planEnds - Date.now()) / 3_600_000);
  const full = plan?.usedSpaces !== undefined && plan.maxSpaces !== undefined && plan.usedSpaces >= plan.maxSpaces;
  const hasPlan = plan?.plan === 'ENTERPRISE';
  const expired = club.data?.status === 'PAUSED' || (isAdmin && isApproved && !!plan && (!hasPlan || hoursLeft <= 0));
  const deadline = club.data?.deletionScheduledAt;
  const graceHours = deadline ? Math.max(0, Math.ceil((Date.parse(deadline) - Date.now()) / 3_600_000)) : null;
  const warning = isAdmin && club.data?.status === 'APPROVED' && hasPlan && hoursLeft > 0 && hoursLeft <= 72;
  const visible = !club.loading && !club.error && club.data;
  const removed = visible && visible.status === 'DELETED';
  const openPeople = (mode: 'members' | 'pending' | 'transfer') =>
    router.push({ pathname: '/social/club-people', params: { id: clubId, mode } });
  const back = () => router.canGoBack() ? router.back() : router.replace('/social');
  const toMyClubs = () => router.dismissTo({ pathname: '/social', params: { section: 'clubs' } });

  async function changeMembership(action: MembershipAction) {
    if (busy || (action !== 'join' && !membership)) return;
    setBusy(true);
    try {
      if (action === 'join') await clubsService.requestMembership(clubId);
      else if (membership) {
        if (action === 'cancel') await clubsService.cancelMembership(membership.id);
        else await clubsService.leave(membership.id);
      }
      refreshMemberships();
      void refresh();
      setConfirmation(action === 'join' ? {
        title: 'Solicitud enviada', message: 'Puedes verla en Enviadas.', label: 'Aceptar',
        Icon: Send, infoOnly: true, onConfirm: () => setConfirmation(null),
      } : null);
      if (action === 'leave') toMyClubs();
    } catch {
      showToast('No pudimos completar la acción. Inténtalo de nuevo.', 'error');
    } finally {
      setBusy(false);
    }
  }

  function confirm(action: MembershipAction) {
    const copy = {
      join: { title: '¿Solicitar ingreso?', message: 'Tu solicitud reserva un espacio mientras el club la revisa.', label: 'Solicitar ingreso', Icon: UserPlus },
      cancel: { title: '¿Cancelar solicitud?', message: 'Puedes volver a solicitar el ingreso más adelante.', label: 'Cancelar solicitud', Icon: X },
      leave: { title: '¿Salir del club?', message: 'Se liberará un espacio en tu plan.', label: 'Salir del club', Icon: LogOut },
    }[action];
    setConfirmation({ ...copy, onConfirm: () => void changeMembership(action) });
  }

  return (
    <CommunityScreen title="Club" onBack={back} action={visible && !removed && (
      isAdmin && !expired ? <Pressable accessibilityRole="button" accessibilityLabel="Editar club" style={styles.iconButton}
        onPress={() => router.push({ pathname: '/social/edit-club', params: { id: clubId } })}>
        <Pencil color={Brand.text} size={20} />
      </Pressable> : !isAdmin && isMember ? <Pressable accessibilityRole="button" accessibilityLabel="Salir del club" style={styles.iconButton} onPress={() => confirm('leave')}>
        <LogOut color={Brand.text} size={20} />
      </Pressable> : null
    )}>
      {club.error ? (
        <ClubError error={club.error} fallback="No pudimos cargar el club." onRetry={refreshClub} />
      ) : <ScreenState loading={club.loading} error={null} />}
      {removed && <View style={styles.closed}>
        <PongiState contextLabel={visible.name} title="Club eliminado"
          artwork={require('../../../../assets/images/club-eliminado.webp')}
          text={isAdmin ? 'Se liberaron los cupos.' : 'Tu cupo ya está disponible.'}
          action={{ label: 'Volver a Mis clubes', icon: LogOut, onPress: toMyClubs }} />
      </View>}
      {visible && !removed && (
        <ScrollView contentContainerStyle={styles.content}>
          {warning && (
            <View style={styles.notice}>
              <View style={styles.noticeRow}><Clock3 color="#FFD278" size={18} />
                <Text style={styles.noticeTitle}>Enterprise vence pronto</Text>
                <Text style={styles.noticeTime}>{hoursLeft} h</Text>
              </View>
              <ActionRow>
                <AuthButton label="Renovar Enterprise" onPress={openPlans} />
                <AuthButton label="Transferir" variant="secondary" onPress={() => openPeople('transfer')} />
              </ActionRow>
            </View>
          )}
          <ClubCard name={visible.name} description={visible.address} featured role={isAdmin ? 'admin' : isMember ? 'member' : undefined}
            creatorName={visible.admin?.name} memberCount={members.data?.length} pending={membership?.status === 'PENDING'} />
          <ClubAbout description={visible.description} />
          {expired && isAdmin && (
            <View style={styles.notice}>
              <View style={styles.noticeRow}>
                <Image source={require('../../../../assets/images/ranky-club-pausado.webp')} style={styles.ranky} contentFit="contain"
                  accessibilityElementsHidden importantForAccessibility="no" />
                <View style={styles.pauseCopy}>
                  <Text style={styles.noticeTitle}>Gestión pausada</Text>
                  {graceHours != null && <Text style={styles.noticeTime}>Quedan {graceHours} h</Text>}
                  <Text style={styles.linkSubtitle}>Renueva o transfiere antes de que el club se elimine automáticamente.</Text>
                </View>
              </View>
              <ActionRow>
                <AuthButton label="Renovar Enterprise" onPress={openPlans} />
                <AuthButton label="Transferir" variant="secondary" onPress={() => openPeople('transfer')} />
              </ActionRow>
            </View>
          )}
          {expired && !isAdmin && isMember && <>
            <ClubNotice title="Club inactivo" message="Puedes salir del club para liberar un espacio." />
            <AuthButton label="Salir del club" icon={LogOut} onPress={() => confirm('leave')} />
          </>}
          {isAdmin && visible.status === 'PENDING' && <ClubNotice title="Registro en revisión" />}
          {isAdmin && visible.status === 'REJECTED' && <>
            <ClubNotice title="Información observada" message="El equipo de PongRank pidió cambios." />
            <AuthButton label="Corregir información" icon={Pencil}
              onPress={() => router.push({ pathname: '/social/edit-club', params: { id: clubId, correcting: 'yes' } })} />
          </>}
          {canEnter && !expired ? <>
            {isAdmin && <AuthButton label="Nuevo aviso" variant="secondary" icon={Megaphone}
              onPress={() => router.push({ pathname: '/social/club-announcements', params: { id: clubId, create: 'yes' } })} />}
            <View style={styles.linkGroup}>
              {isAdmin && <ClubLink label="Solicitudes recibidas" Icon={UserPlus} count={pending.data?.totalElements} onPress={() => openPeople('pending')} />}
              <ClubLink label="Ver ranking" Icon={ChartNoAxesColumnIncreasing} subtitle="Posiciones y rating"
                onPress={() => router.push({ pathname: '/social/club-people', params: { id: clubId, mode: 'ranking' } })} />
              <ClubLink label="Avisos" Icon={Megaphone} subtitle="Anuncios del club"
                onPress={() => router.push({ pathname: '/social/club-announcements', params: { id: clubId } })} />
              {isAdmin && <ClubLink label="Revisar llave" Icon={GitFork}
                onPress={() => router.push({ pathname: '/social/bracket-review', params: { clubId } })} />}
              <ClubLink label={isAdmin ? 'Gestionar miembros' : 'Ver miembros'} Icon={Users}
                subtitle={members.data ? `${members.data.length} miembros` : undefined} onPress={() => openPeople('members')} last />
            </View>
            {isAdmin && !warning && <AuthButton label="Transferir administración" variant="text" onPress={() => openPeople('transfer')} />}
          </> : !isAdmin && !!top.length && (
            <View style={styles.podium}>
              <View style={styles.noticeRow}><Trophy size={18} color="#FFD278" />
                <Text style={styles.noticeTitle}>Top 3 del club</Text></View>
              {top.map((person, index) => <View key={person.id} style={styles.podiumRow}>
                <Text style={{ color: ['#FFD278', '#D4D8E0', '#EAA578'][index], fontWeight: '700' }}>{index + 1}</Text>
                <Text style={styles.noticeTitle}>{person.name}</Text>
                <Text style={{ color: index === 0 ? '#FFD278' : '#22D3EE', fontWeight: '700' }}>{Math.round(person.ratingGlicko)}</Text>
              </View>)}
            </View>
          )}
          {!isAdmin && visible.status === 'APPROVED' && (
            <View style={styles.actions}>
              <ScreenState loading={memberships.loading} error={memberships.error} errorMessage="No pudimos consultar tu solicitud." onRetry={refreshMemberships} />
              {!memberships.loading && !memberships.error && (
                membership?.status === 'PENDING' ? (
                  <>

                    <AuthButton label="Cancelar solicitud" icon={X} loading={busy} onPress={() => confirm('cancel')} />
                  </>
                ) : !isMember && (
                  full ? (
                    <>
                      <ClubNotice title="Sin espacios disponibles" message={`${plan.usedSpaces} de ${plan.maxSpaces} espacios`} />
                      <ActionRow>
                        <AuthButton label="Mis espacios" variant="secondary" onPress={() => router.push('/profile/plan')} />
                        <AuthButton label="Ver planes" icon={Layers} onPress={openPlans} />
                      </ActionRow>
                    </>
                  ) : <>
                    {membership?.status === 'REJECTED' && <ClubNotice title="Solicitud rechazada" message="El club no aprobó tu solicitud." />}
                    <AuthButton label={membership?.status === 'REJECTED' ? 'Volver a solicitar' : 'Solicitar ingreso'} icon={UserPlus}
                      loading={busy} onPress={() => confirm('join')} />
                  </>
                )
              )}
            </View>
          )}
        </ScrollView>
      )}
      <ConfirmDialog confirmation={confirmation} busy={busy} onCancel={() => setConfirmation(null)} />
    </CommunityScreen>
  );
}

function ClubLink({ label, Icon, onPress, count, subtitle, last }: {
  label: string;
  Icon: typeof Users;
  onPress: () => void;
  count?: number;
  subtitle?: string;
  last?: boolean;
}) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.link, last && styles.lastLink]}>
    <Icon size={19} color="#22D3EE" />
    <View style={styles.linkCopy}>
      <Text style={styles.linkText}>{label}</Text>
      {subtitle && <Text style={styles.linkSubtitle}>{subtitle}</Text>}
    </View>
    {!!count && <Text style={styles.count} accessibilityLabel={`${count} pendientes`}>{count}</Text>}
    <ChevronRight size={18} color={Brand.textSecondary} />
  </Pressable>;
}

const styles = StyleSheet.create({
  linkGroup: { borderWidth: 1, borderColor: Brand.border, borderRadius: 14, backgroundColor: Brand.surface, overflow: 'hidden' },
  lastLink: { borderBottomWidth: 0 },
  podium: { backgroundColor: Brand.surface, borderWidth: 1, borderColor: '#8E703B', borderRadius: 14, padding: 12, gap: 8 },
  podiumRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: 1, borderColor: Brand.border },
  link: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: 12,
    borderColor: Brand.border, borderBottomWidth: 1 },
  linkCopy: { flex: 1, gap: 2 },
  linkText: { color: Brand.text, fontWeight: '700' },
  linkSubtitle: { color: Brand.textSecondary, fontSize: 13 },
  count: { backgroundColor: Brand.primary, color: Brand.text, fontWeight: '800', borderRadius: 12,
    minWidth: 24, minHeight: 24, textAlign: 'center', lineHeight: 24, paddingHorizontal: 5 },
  content: { gap: Spacing.three, paddingBottom: 12 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  closed: { flex: 1, justifyContent: 'center' },
  pauseCopy: { flex: 1, gap: 3 },
  actions: { gap: Spacing.two },
  notice: { borderRadius: 14, borderWidth: 1, borderColor: '#715426', backgroundColor: '#372A15', padding: 12, gap: Spacing.two },
  ranky: { width: 80, height: 80 },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  noticeTitle: { flex: 1, color: Brand.text, fontSize: 14, fontWeight: '700' },
  noticeTime: { color: '#FFD278', fontWeight: '800', fontVariant: ['tabular-nums'] },
});
