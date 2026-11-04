import { router } from 'expo-router';
import { Check, MapPin, MessageCircle } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { LocationNotice } from '@/components/common/location-notice';
import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenState } from '@/components/common/screen-state';
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
  { value: 'friends', label: 'Amigos', empty: 'Ninguno de tus amigos tiene una partida abierta ahora.' },
  { value: 'community', label: 'Comunidad', empty: 'No hay partidas abiertas en tus comunidades.' },
  { value: 'open', label: 'Libres', empty: 'No hay partidas libres cerca de ti con tu nivel. Crea una y espera rival.' },
];

const FORMAT_LABELS: Record<MatchResponse['format'], string> = { BO3: 'Mejor de 3', BO5: 'Mejor de 5', BO7: 'Mejor de 7' };

export default function FindMatchScreen() {
  const { coords, status, retry } = useLocation();
  const [confirmed, setConfirmed] = useState<MatchResponse | null>(null);

  return (
    <ScreenContainer title={confirmed ? 'Partida confirmada' : 'Buscar partida'}>
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
  const phone = opponent.whatsapp?.replace(/\D/g, '');

  return (
    <View style={styles.confirmed}>
      <View style={styles.check}>
        <Check color="#22D3EE" size={44} />
      </View>
      <Text style={styles.confirmedTitle}>¡Partida confirmada!</Text>
      <Text style={styles.meta}>Ya quedó pactada con {opponent.name}</Text>
      <View style={styles.summary}>
        <Text style={styles.name}>{opponent.name}</Text>
        <Text style={styles.meta}>{Math.round(opponent.ratingGlicko)}</Text>
        <View style={styles.place}>
          <MapPin color={Brand.red} size={14} />
          <Text style={styles.placeText}>{match.communityName ?? 'Partida libre'}</Text>
        </View>
        <Text style={styles.chip}>{FORMAT_LABELS[match.format]}</Text>
      </View>
      {phone ? (
        <Pressable style={styles.whatsapp} onPress={() => Linking.openURL(`https://wa.me/${phone}`)}>
          <MessageCircle color="#22D3EE" size={20} />
          <Text style={styles.whatsappLabel}>Coordinar por WhatsApp</Text>
        </Pressable>
      ) : (
        <Text style={styles.note}>Este jugador no compartió un contacto directo. Coordina el encuentro en el lugar y hora acordados.</Text>
      )}
      <AuthButton label="Empezar partido" onPress={() => router.replace(`/match/${match.id}`)} style={styles.start} />
      <Pressable onPress={() => router.replace('/matches')} hitSlop={12}>
        <Text style={styles.link}>Ver mis partidas</Text>
      </Pressable>
    </View>
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
  confirmed: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.four },
  check: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: '#22D3EE', alignItems: 'center', justifyContent: 'center' },
  confirmedTitle: { color: Brand.text, fontSize: 26, fontWeight: '800', marginTop: Spacing.two },
  summary: { alignSelf: 'stretch', marginTop: Spacing.three, padding: Spacing.three, borderRadius: Spacing.three, borderWidth: 1, borderColor: Brand.red, backgroundColor: Brand.surface },
  whatsapp: { alignSelf: 'stretch', minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two, borderRadius: Spacing.three, borderWidth: 1.5, borderColor: '#22D3EE', marginTop: Spacing.two },
  whatsappLabel: { color: '#22D3EE', fontWeight: '700' },
  note: { color: Brand.textSecondary, fontSize: 13, textAlign: 'center', marginTop: Spacing.two },
  start: { alignSelf: 'stretch', marginTop: Spacing.two },
  link: { color: Brand.textSecondary, marginTop: Spacing.two },
});
