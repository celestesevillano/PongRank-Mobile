import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, ChevronRight, Ellipsis, Medal, UserCheck, X, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ActionRow } from '@/components/common/action-row';
import { ConfirmDialog, type Confirmation } from '@/components/common/confirm-dialog';
import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenState } from '@/components/common/screen-state';
import { CommunityScreen } from '@/components/communities/community-screen';
import { challengePlayer, openPlayer, PongiState, pongiArt } from '@/components/pongmigos/pongmigos-ui';
import { Brand, Spacing } from '@/constants/theme';
import { usePlan } from '@/context/plan';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { playersService } from '@/services/players.service';
import { friendshipsService } from '@/services/friendships.service';
import type { PlayerSummary } from '@/types/api';
import { toProfilePresentation } from '@/utils/profile-presentation';
import { usePaginated } from '@/hooks/use-paginated';
import { clubsService } from '@/services/clubs.service';

const back = () => router.canGoBack() ? router.back() : router.replace('/social');

export default function ClubPeopleScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode: string }>();
  const clubId = Number(id);
  const pending = mode === 'pending';
  if (mode === 'ranking') return <ClubRanking clubId={clubId} />;
  if (mode === 'transfer') return <ClubTransfer clubId={clubId} />;
  return <ClubPeople clubId={clubId} pending={pending} />;
}

function ClubPeople({ clubId, pending }: { clubId: number; pending: boolean }) {
  const { player } = useSession();
  const { showToast } = useToast();
  const entries = usePaginated((params, signal) => clubsService.people(clubId, pending ? 'pending' : 'members', params, signal), [clubId, pending], 20);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [busy, setBusy] = useState(false);

  function ask(title: string, name: string, label: string, Icon: LucideIcon, operation: () => Promise<unknown>) {
    setConfirmation({ title, message: name, label, Icon, onConfirm: () => {
      if (busy) return;
      setBusy(true);
      void operation().then(() => {
        setConfirmation(null);
        entries.refetch();
      }).catch(() => {
        showToast('No pudimos actualizar la solicitud.', 'error');
      }).finally(() => setBusy(false));
    } });
  }

  return (
    <CommunityScreen title={pending ? 'Solicitudes recibidas' : 'Miembros'} onBack={back}>
      {entries.error?.isNetwork ? <View style={styles.centered}>
        <PongiState error={entries.error} errorMessage="No pudimos conectar con PongRank." retry={entries.refetch} />
      </View> : <ScreenState loading={entries.loading} error={entries.error} errorMessage="No pudimos cargar la lista." onRetry={entries.refetch} />}
      {entries.data && !entries.loading && !entries.error && (
        <FlatList data={entries.data.content} keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, entries.data.content.length === 0 && styles.centered]}
          ListHeaderComponent={!pending
            ? <Text style={styles.meta}>{entries.data.totalElements} miembros</Text> : undefined}
          ListEmptyComponent={<PongiState artwork={pongiArt.inbox} text={pending ? 'No tienes solicitudes pendientes.' : 'Aún no hay miembros para mostrar.'} />}
          ListFooterComponent={entries.data.totalPages > 1 ? <PaginationBar page={entries.data} onPageChange={entries.setPage} /> : undefined}
          renderItem={({ item }) => {
            const person = item.player;
            const name = person?.name ?? 'Jugador';
            return (
              <View style={[styles.card, item.role === 'CLUB_ADMIN' && styles.adminCard]}>
                <View style={styles.identity}>
                  {person && <ClubPlayerAvatar player={person} admin={item.role === 'CLUB_ADMIN'} />}
                  <View style={styles.identityText}>
                    <Text style={styles.name}>{name}{person?.id === player?.id ? ' · Tú' : ''}</Text>
                    {item.role === 'CLUB_ADMIN' && <Text style={styles.admin}>Administrador del club</Text>}
                    {pending && person && <Text style={styles.meta}>{Math.round(person.ratingGlicko)} de rating</Text>}
                  </View>
                  {pending && person && <AuthButton label="Ver perfil" variant="text" onPress={() => openPlayer(person)} />}
                  {!pending && person && person.id !== player?.id && <MemberActions player={person} />}
                </View>
                {pending && <ActionRow>
                  <AuthButton label="Aceptar" icon={Check} onPress={() => ask('¿Aceptar solicitud?', name, 'Aceptar', Check, () => clubsService.reviewMembership(item.id, 'approve'))} />
                  <AuthButton label="Rechazar" icon={X} variant="secondary" onPress={() => ask('¿Rechazar solicitud?', name, 'Rechazar', X, () => clubsService.reviewMembership(item.id, 'reject'))} />
                </ActionRow>}
              </View>
            );
          }} />
      )}
      <ConfirmDialog confirmation={confirmation} busy={busy} onCancel={() => setConfirmation(null)} />
    </CommunityScreen>
  );
}

function ClubTransfer({ clubId }: { clubId: number }) {
  const candidates = useFetch((signal) => clubsService.transferCandidates(clubId, signal), [clubId]);
  const { openPlans, refresh } = usePlan();
  const { showToast } = useToast();
  const [selected, setSelected] = useState<PlayerSummary>();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function transfer() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await clubsService.transfer(clubId, selected.id);
      setConfirm(false);
      void refresh();
      back();
    } catch {
      setConfirm(false);
      setSelected(undefined);
      candidates.refetch();
      showToast('No pudimos transferir la administración.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return <CommunityScreen title="Transferir administración" onBack={back}>
    <ScreenState loading={candidates.loading} error={candidates.error} errorMessage="No pudimos consultar a los miembros." onRetry={candidates.refetch} />
    {!candidates.loading && !candidates.error && (candidates.data?.length ? <>
      <Text style={styles.meta}>Elige a un miembro con Enterprise vigente y cupo para administrar.</Text>
      <FlatList data={candidates.data} keyExtractor={({ id }) => String(id)} contentContainerStyle={styles.list}
        renderItem={({ item }) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected?.id === item.id }}
          style={[styles.card, selected?.id === item.id && styles.selected]} onPress={() => setSelected(item)}>
          <View style={styles.identity}><ClubPlayerAvatar player={item} />
            <View style={styles.identityText}>
              <Text style={styles.name}>{item.name}</Text><Text style={styles.meta}>Enterprise · Cupo disponible</Text>
            </View>
            {selected?.id === item.id && <Check size={18} color="#22D3EE" />}
          </View>
        </Pressable>} />
      <AuthButton label="Continuar" disabled={!selected} onPress={() => setConfirm(true)} />
    </> : <View style={styles.centered}>
      <PongiState title="Sin miembros elegibles" artwork={require('../../../../assets/images/ranky-club-pausado.webp')}
        text="Renueva Enterprise para mantener activo el club."
        action={{ label: 'Renovar Enterprise', icon: UserCheck, onPress: openPlans }} />
    </View>)}
    <ConfirmDialog busy={busy} onCancel={() => setConfirm(false)} confirmation={confirm && selected ? {
      title: '¿Transferir administración?', message: selected.name, label: 'Transferir', Icon: UserCheck, onConfirm: transfer,
    } : null} />
  </CommunityScreen>;
}

function ClubPlayerAvatar({ player, admin }: { player: PlayerSummary; admin?: boolean }) {
  const photo = useFetch(async (signal) =>
    toProfilePresentation(await playersService.presentation(player.id, signal)).photo, [player.id]);
  const initials = player.name.trim().split(/\s+/).slice(0, 2).map((word) => word.charAt(0)).join('').toUpperCase();
  return <View style={styles.avatarFrame}>
    <View style={styles.avatar}>
      {photo.data ? <Image source={photo.data} style={StyleSheet.absoluteFill} contentFit="cover" />
        : <Text style={styles.initials}>{initials}</Text>}
    </View>
    {admin && <Image source={require('../../../../assets/images/club-admin-shield.webp')} tintColor="#FF5963"
      style={styles.shield} contentFit="contain" accessible={false} />}
  </View>;
}

function MemberActions({ player }: { player: PlayerSummary }) {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);
  const act = (action: () => void) => { setOpen(false); action(); };

  return <View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Acciones para ${player.name}`} accessibilityState={{ expanded: open }}
      onPress={() => setOpen((value) => !value)} style={styles.kebab}><Ellipsis color={Brand.textSecondary} size={20} /></Pressable>
    {open && <View style={styles.menu}>
      <AuthButton label="Ver perfil" variant="text" onPress={() => act(() => openPlayer(player))} />
      <AuthButton label="Retar a una partida" variant="text" onPress={() => act(() => challengePlayer(player))} />
      <AuthButton label="Enviar solicitud" variant="text" disabled={sending} onPress={async () => {
        if (sending) return;
        setSending(true);
        try {
          await friendshipsService.send(player.id);
          showToast('Solicitud de Pongmigo enviada.', 'success');
          setOpen(false);
        } catch {
          showToast('No pudimos enviar la solicitud. Revisa el estado en su perfil.', 'error');
        } finally {
          setSending(false);
        }
      }} />
    </View>}
  </View>;
}

function ClubRanking({ clubId }: { clubId: number }) {
  const ranking = useFetch((signal) => clubsService.allMembers(clubId, signal), [clubId]);
  const entries = (ranking.data ?? []).flatMap(({ player }) => player ? [player] : [])
    .sort((a, b) => b.ratingGlicko - a.ratingGlicko || a.id - b.id);
  return <CommunityScreen title="Ranking del club" onBack={back}>
    <ScreenState loading={ranking.loading} error={ranking.error} errorMessage="No pudimos cargar el ranking." onRetry={ranking.refetch} />
    {!ranking.loading && !ranking.error && <FlatList data={entries} keyExtractor={({ id }) => String(id)}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<PongiState text="Aún no hay posiciones." />}
      renderItem={({ item, index }) => {
        const color = ['#FFD278', '#D4D8E0', '#EAA578'][index] ?? '#22D3EE';
        return <Pressable accessibilityRole="button" onPress={() => openPlayer(item)} style={[styles.card, index < 3 && { borderColor: color }]}>
          <View style={styles.identity}>
            {index < 3 && <Medal size={17} color={color} />}
            <Text style={[styles.meta, { color }]}>{index + 1}</Text>
            <Text style={[styles.name, styles.identityText]}>{item.name}</Text>
            <Text style={[styles.name, { color }]}>{Math.round(item.ratingGlicko)}</Text>
            <ChevronRight size={17} color={Brand.textSecondary} />
          </View>
        </Pressable>;
      }} />}
  </CommunityScreen>;
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  identityText: { flex: 1, minWidth: 0 },
  avatarFrame: { width: 42, height: 42 },
  avatar: { flex: 1, overflow: 'hidden', borderRadius: 21, backgroundColor: '#193036', alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#62DCE9', fontWeight: '700', fontSize: 13 },
  selected: { borderColor: '#22D3EE' },
  adminCard: { backgroundColor: '#32181E', borderColor: '#9D3742' },
  admin: { color: '#FFB3B7', fontSize: 13 },
  shield: { position: 'absolute', width: 22, height: 22, bottom: -3, right: -4 },
  kebab: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  menu: { alignSelf: 'flex-end', alignItems: 'flex-start', borderWidth: 1, borderColor: Brand.border, borderRadius: 12, backgroundColor: '#1E1E20' },
  list: { gap: Spacing.two, paddingVertical: 12 },
  centered: { flexGrow: 1, justifyContent: 'center' },
  card: { borderWidth: 1, borderColor: Brand.border, borderRadius: 14, backgroundColor: Brand.surface, padding: 12, gap: Spacing.two },
  name: { color: Brand.text, fontWeight: '700', fontSize: 16 },
  meta: { color: Brand.textSecondary, fontSize: 14 },
});
