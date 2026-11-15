import { Image } from 'expo-image';
import { router } from 'expo-router';
import { CalendarClock, MapPin, Swords } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { LocationNotice } from '@/components/common/location-notice';
import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenState } from '@/components/common/screen-state';
import { WhatsAppMatchButton } from '@/components/matches/whatsapp-match-button';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { useLocation } from '@/hooks/use-location';
import { friendOf, friendshipsService } from '@/services/friendships.service';
import { matchesService, type Coordinates } from '@/services/matches.service';
import type { MatchResponse } from '@/types/api';
import { toApiError } from '@/utils/api-error';

type Tab = 'friends' | 'community' | 'open';

const TABS: { value: Tab; label: string; empty: string }[] = [
  { value: 'friends', label: 'Pongmigos', empty: 'Ninguno de tus Pongmigos tiene una partida abierta ahora.' },
  { value: 'community', label: 'Comunidad', empty: 'No hay partidas abiertas en tus comunidades.' },
  { value: 'open', label: 'Libres', empty: 'No hay partidas libres cerca de ti con tu nivel. Crea una y espera rival.' },
];

const FORMAT_LABELS: Record<MatchResponse['format'], string> = { BO3: 'Mejor de 3', BO5: 'Mejor de 5', BO7: 'Mejor de 7' };

export default function FindMatchScreen() {
  const { coords, status, retry } = useLocation();
  const [confirmed, setConfirmed] = useState<MatchResponse | null>(null);

  return (
    <ScreenContainer title={confirmed ? undefined : 'Buscar partida'}>
      {!confirmed && (
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Volver</Text>
        </Pressable>
      )}
      {confirmed ? (
        <Confirmed match={confirmed} />
      ) : status === 'ready' && coords ? (
        <OpenMatches coords={coords} onJoined={setConfirmed} />
      ) : (
        <LocationNotice status={status === 'ready' ? 'unavailable' : status} onRetry={retry} />
      )}
    </ScreenContainer>
  );
}

function OpenMatches({ coords, onJoined }: { coords: Coordinates; onJoined: (match: MatchResponse) => void }) {
  const { player } = useSession();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('friends');
  const [friendIds, setFriendIds] = useState<Set<number>>(new Set());
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const { data, loading, error, refetch } = useFetch((signal) => matchesService.open(coords, signal), [coords.latitude, coords.longitude]);

  useEffect(() => {
    if (!player) return;
    const controller = new AbortController();
    friendshipsService
      .accepted(player.id, controller.signal)
      .then((list) => setFriendIds(new Set(list.map((f) => friendOf(f, player.id).id))))
      .catch(() => setFriendIds(new Set()));
    return () => controller.abort();
  }, [player]);

  const visible = useMemo(() => {
    const matches = data ?? [];
    if (tab === 'friends') return matches.filter((m) => friendIds.has(m.player1.id));
    if (tab === 'community') return matches.filter((m) => m.matchType === 'COMMUNITY');
    return matches.filter((m) => m.matchType === 'LOCATION');
  }, [data, tab, friendIds]);

  const join = async (match: MatchResponse) => {
    setJoiningId(match.id);
    try {
      onJoined(await matchesService.join(match.id, coords));
    } catch (err) {
      showToast(toApiError(err).message, 'error');
      refetch();
    } finally {
      setJoiningId(null);
    }
  };

  const current = TABS.find((item) => item.value === tab) ?? TABS[0];

  return (
    <View style={styles.flex}>
      <View style={styles.tabs}>
        {TABS.map((item) => {
          const selected = item.value === tab;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={[styles.tab, selected && styles.tabActive]}
              onPress={() => setTab(item.value)}
            >
              <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <ScreenState loading={loading} error={error} empty={!loading && !error && visible.length === 0} emptyMessage={current.empty} onRetry={refetch} />
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.player1.name.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.name}>{item.player1.name}</Text>
              <Text style={styles.meta}>{Math.round(item.player1.ratingGlicko)}</Text>
              <View style={styles.place}>
                <MapPin color={Brand.red} size={14} />
                <Text style={styles.placeText}>{item.communityName ?? 'Partida libre'}</Text>
              </View>
              <Text style={styles.chip}>{FORMAT_LABELS[item.format]}</Text>
            </View>
            <AuthButton label="Unirme" variant="ghost" loading={joiningId === item.id} disabled={joiningId !== null} onPress={() => join(item)} style={styles.join} />
          </View>
        )}
      />
    </View>
  );
}

function Confirmed({ match }: { match: MatchResponse }) {
  const opponent = match.player1;
  const initials = opponent.name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.confirmationContent}>
      <View style={styles.confirmed}>
        <Image source={require('../../../assets/images/pongrank-match-confirmed.webp')} contentFit="cover" style={styles.confirmedArt} accessible={false} />
        <Text accessibilityRole="header" style={styles.confirmedTitle}>Partida confirmada</Text>
        <View style={styles.rivalRow}>
          <View style={styles.rivalAvatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <Text style={styles.name}>{opponent.name}</Text>
        </View>
        <View style={styles.confirmationRow}><CalendarClock color={Brand.cyan} size={17} /><Text style={styles.confirmationLabel}>Hora por coordinar</Text></View>
        <View style={styles.confirmationRow}><MapPin color={Brand.cyan} size={17} /><Text style={styles.confirmationLabel}>{match.communityName ?? 'Partida libre'}</Text></View>
        <WhatsAppMatchButton opponent={opponent} showUnavailable />
        <AuthButton label="Empezar partida" icon={Swords} onPress={() => router.replace(`/match/${match.id}`)} />
        <AuthButton label="Ver mis partidas" variant="text" onPress={() => router.replace('/matches')} style={styles.allMatches} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  back: { color: Brand.textSecondary, marginBottom: Spacing.three },
  tabs: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: Spacing.three, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  tabActive: { borderColor: '#22D3EE', backgroundColor: '#0b1a1d' },
  tabLabel: { color: Brand.text, fontWeight: '600' },
  tabLabelActive: { color: '#22D3EE' },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three, backgroundColor: Brand.surface, borderRadius: Spacing.three, padding: Spacing.three, borderWidth: 1, borderColor: Brand.border },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#1C8B9B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Brand.text, fontWeight: '700' },
  name: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  meta: { color: Brand.textSecondary, fontSize: 13 },
  place: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  placeText: { color: Brand.red, fontSize: 13 },
  chip: { alignSelf: 'flex-start', marginTop: 6, color: Brand.text, fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: Brand.border },
  join: { alignSelf: 'flex-end', paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
  confirmationContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: Spacing.three },
  confirmed: { alignSelf: 'center', width: '100%', maxWidth: 460, gap: Spacing.two, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#365760', backgroundColor: '#11171B' },
  confirmedArt: { width: '100%', aspectRatio: 1.9, borderRadius: 12 },
  confirmedTitle: { color: Brand.cyan, textAlign: 'center', fontSize: 25, fontWeight: '800', marginVertical: Spacing.one },
  rivalRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: Spacing.two, borderRadius: 12, backgroundColor: '#202B31' },
  rivalAvatar: { width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#32454D' },
  confirmationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 44, paddingHorizontal: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: Brand.border },
  confirmationLabel: { color: Brand.text, fontSize: 14, flexShrink: 1 },
  allMatches: { paddingVertical: 8 },
});
