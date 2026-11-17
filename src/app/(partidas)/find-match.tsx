import { router } from 'expo-router';
import { ChevronLeft, MapPin, Plus, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { PillTabs } from '@/components/common/pill-tabs';
import { ScreenContainer } from '@/components/common/screen-container';
import { MatchMeta, MatchState, formatLabels, matchArt, matchPlace } from '@/components/matches/match-ui';
import { PlayerIdentity } from '@/components/pongmigos/pongmigos-ui';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { useLocation } from '@/hooks/use-location';
import { useMatchAddress } from '@/hooks/use-match-address';
import { circleOptions, matchRivals } from '@/services/match-circles.service';
import { matchesService, type Coordinates } from '@/services/matches.service';
import type { MatchResponse } from '@/types/api';
import { toApiError } from '@/utils/api-error';

const tabs = [...circleOptions, { key: 'open', label: 'Libres' }] as const;
type Tab = typeof tabs[number]['key'];
const emptyText: Record<Tab, string> = {
  friends: 'Ninguno de tus Pongmigos tiene una partida abierta.',
  community: 'No hay partidas abiertas en tus comunidades.',
  club: 'No hay partidas abiertas en tus clubes.',
  open: 'No hay partidas libres cerca de ti.',
};

export default function FindMatchScreen() {
  const { coords, status, retry } = useLocation();
  return <ScreenContainer title="Buscar partida">
    <AuthButton label="Volver" icon={ChevronLeft} variant="ghost" style={styles.back} onPress={() => router.back()} />
    {status === 'ready' && coords ? <OpenMatches coords={coords} /> : <View style={styles.center}>
      {status === 'loading' ? <ActivityIndicator color={Brand.red} />
        : <MatchState title="Activa tu ubicación" art={matchArt.location}
            message={status === 'denied' ? 'Permite el acceso a tu ubicación en Ajustes para encontrar partidas cercanas.' : 'Necesitamos tu ubicación para mostrar partidas cerca de ti.'}>
            <AuthButton label="Reintentar" onPress={retry} />
          </MatchState>}
    </View>}
  </ScreenContainer>;
}

function OpenMatches({ coords }: { coords: Coordinates }) {
  const { player } = useSession();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('friends');
  const [joiningId, setJoiningId] = useState<number>();
  const matches = useFetch((signal) => matchesService.open(coords, signal), [coords.latitude, coords.longitude]);
  const circle = useFetch((signal) => tab === 'open' ? Promise.resolve([]) : matchRivals(tab, player?.id ?? 0, signal), [tab, player?.id]);
  const loading = matches.loading || (tab !== 'open' && circle.loading);
  const error = matches.error ?? (tab === 'open' ? undefined : circle.error);
  const memberIds = new Set(circle.data?.map(({ id }) => id));
  const visible = matches.data?.filter((match) => tab === 'open' || memberIds.has(match.player1.id)) ?? [];

  async function join(match: MatchResponse) {
    if (joiningId != null) return;
    setJoiningId(match.id);
    try {
      const joined = await matchesService.join(match.id, coords);
      router.replace({ pathname: '/match/[id]', params: { id: joined.id, origin: tab === 'open' ? 'Partida libre' : circle.data?.find(({ id }) => id === match.player1.id)?.groupName
          ?? tabs.find((option) => option.key === tab)?.label } });
    } catch (err) {
      showToast(toApiError(err).message, 'error');
      matches.refetch();
    } finally {
      setJoiningId(undefined);
    }
  }

  return <View style={styles.flex}>
    <PillTabs options={tabs} selected={tab} onSelect={setTab} />
    {loading || error
      ? <View style={styles.center}>{loading
        ? <ActivityIndicator color={Brand.red} />
        : <MatchState title={error?.isNetwork ? 'Problema de conexión' : 'No pudimos cargar las partidas'} art={error?.isNetwork ? matchArt.offline : undefined}
            message={error?.isNetwork ? 'No pudimos conectar con PongRank. Revisa tu conexión.' : 'Intenta de nuevo en unos momentos.'}>
            <AuthButton label="Reintentar" onPress={() => { matches.refetch(); circle.refetch(); }} />
          </MatchState>}</View>
      : visible.length ? <FlatList data={visible} style={styles.flex} contentContainerStyle={styles.list}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <OpenMatchCard match={item} joining={joiningId === item.id} disabled={joiningId != null}
          onJoin={() => { void join(item); }} />} />
      : <>
        <View style={styles.center}><MatchState title="Sin partidas abiertas" message={emptyText[tab]} art={matchArt.search} /></View>
        <AuthButton label="Nueva partida" style={styles.footer} icon={Plus} onPress={() => router.push('/new-match')} />
      </>}
  </View>;
}

function OpenMatchCard({ match, joining, disabled, onJoin }: { match: MatchResponse; joining: boolean; disabled: boolean; onJoin: () => void }) {
  const address = useMatchAddress(match.latitude, match.longitude);
  return <View style={styles.card}>
    <View style={styles.row}><PlayerIdentity player={match.player1} showRating /><Text style={styles.format}>{formatLabels[match.format]}</Text></View>
    <MatchMeta icon={MapPin} text={address ?? matchPlace(match) ?? 'Partida libre'} />
    <AuthButton label="Unirme" icon={UserPlus} loading={joining} disabled={disabled} onPress={onJoin} />
  </View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center' },
  back: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  list: { gap: Spacing.two, paddingBottom: Spacing.three },
  footer: { marginBottom: Spacing.three },
  card: { gap: 10, padding: 12, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface, borderRadius: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  format: { color: Brand.textSecondary, fontSize: 12, backgroundColor: '#26262B', padding: 6, borderRadius: 9 },
});
