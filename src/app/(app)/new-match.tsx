import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, Clock, LocateFixed, MapPin, Search, Swords, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ActionRow } from '@/components/common/action-row';
import { LocationNotice } from '@/components/common/location-notice';
import { PillTabs } from '@/components/common/pill-tabs';
import { ScreenContainer } from '@/components/common/screen-container';
import { formatLabels, matchArt, MatchMeta, MatchState } from '@/components/matches/match-ui';
import { PlayerIdentity } from '@/components/pongmigos/pongmigos-ui';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useFetch } from '@/hooks/use-fetch';
import { useLocation } from '@/hooks/use-location';
import { useMatchAddress } from '@/hooks/use-match-address';
import { circleOptions, matchRivals, type Circle, type MatchRival } from '@/services/match-circles.service';
import { matchesService, type Coordinates, type MatchCreateInput } from '@/services/matches.service';
import { placesAvailable, placesService, type PlaceSuggestion } from '@/services/places.service';
import { toApiError } from '@/utils/api-error';

const formats = (Object.keys(formatLabels) as MatchCreateInput['format'][]).map((key) => ({ key, label: formatLabels[key] }));
const clockText = (date: Date) => date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
type Step = 1 | 2 | 3 | 4;

export default function NewMatchScreen() {
  const { opponentId } = useLocalSearchParams<{ opponentId?: string }>();
  const { player } = useSession();
  const { showToast } = useToast();
  const { coords, status, retry } = useLocation();
  const currentAddress = useMatchAddress(coords?.latitude, coords?.longitude);
  const [step, setStep] = useState<Step>(opponentId ? 2 : 1);
  const [circle, setCircle] = useState<Circle>('friends');
  const [opponent, setOpponent] = useState<MatchRival | null>(null);
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<MatchCreateInput['format']>('BO3');
  const [placeQuery, setPlaceQuery] = useState('');
  const [place, setPlace] = useState<{ name: string; coords: Coordinates }>();
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [time, setTime] = useState(() => new Date());
  const [busy, setBusy] = useState(false);
  const [resolvingPlace, setResolvingPlace] = useState(false);

  const rivals = useFetch((signal) => step === 2 ? matchRivals(circle, player?.id ?? 0, signal) : Promise.resolve([]), [step, circle, player?.id]);
  const visible = rivals.data?.filter((item) => item.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) ?? [];
  const selectedRival = opponent ?? (circle === 'friends' ? visible.find((item) => item.id === Number(opponentId)) : undefined);
  const needsLocation = !opponent || circle === 'club';
  const chosenCoordinates = place?.coords ?? coords;
  const address = place?.name ?? currentAddress ?? (coords ? 'Ubicación actual' : 'Sin ubicación');
  const debouncedQuery = useDebouncedValue(placeQuery.trim(), 350);

  useEffect(() => {
    if (step !== 3 || !placesAvailable || debouncedQuery.length < 3 || place) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    void placesService.autocomplete(debouncedQuery, controller.signal).then((items) => {
      if (!controller.signal.aborted) setSuggestions(items);
    }).catch(() => {
      if (!controller.signal.aborted) setSuggestions([]);
    });
    return () => controller.abort();
  }, [step, debouncedQuery, place]);

  async function selectPlace(suggestion: PlaceSuggestion) {
    setResolvingPlace(true);
    try {
      const position = await placesService.coordinates(suggestion.placeId);
      setPlace({ name: suggestion.description, coords: position });
      setPlaceQuery(suggestion.description);
      setSuggestions([]);
    } catch {
      showToast('No pudimos usar ese lugar. Intenta con otro.', 'error');
    } finally {
      setResolvingPlace(false);
    }
  }

  async function submit() {
    if (busy || (needsLocation && !chosenCoordinates)) return;
    const context = !opponent || circle === 'club' ? 'LOCATION' : circle === 'community' ? 'COMMUNITY' : 'FRIEND';
    setBusy(true);
    try {
      const match = await matchesService.create({
        matchType: context, format, opponentId: opponent?.id,
        communityId: context === 'COMMUNITY' ? opponent?.groupId : undefined,
        ...(chosenCoordinates ?? {}),
      });
      router.replace({ pathname: '/match/[id]', params: { id: match.id, origin: opponent?.groupName ?? (opponent ? 'Pongmigos' : 'Partida libre'),
        place: place?.name ?? currentAddress ?? undefined } });
    } catch (error) {
      showToast(toApiError(error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  function back() {
    if (step === 4) setStep(3);
    else if (step === 3) setStep(opponent ? 2 : 1);
    else if (step === 2) setStep(1);
    else router.back();
  }

  return <ScreenContainer>
    <AuthButton label="Volver" icon={ChevronLeft} variant="ghost" onPress={back} style={styles.back} disabled={busy} />
    <View style={styles.step}><Text style={styles.muted}>Paso {step} de 4</Text>
      <View style={styles.bars}>{[1, 2, 3, 4].map((segment) => <View key={segment} style={[styles.bar, segment <= step && styles.filled]} />)}</View>
    </View>

    {step === 1 && <View style={styles.stack}>
      <Text accessibilityRole="header" style={styles.title}>¿Contra quién quieres jugar?</Text>
      <Pressable accessibilityRole="button" style={styles.choice} onPress={() => { setOpponent(null); setStep(2); }}>
        <Users size={21} color={Brand.cyan} /><View style={styles.flex}><Text style={styles.label}>Mi círculo social</Text>
          <Text style={styles.muted}>Elige a alguien de Pongmigos, tus comunidades o tus clubes.</Text></View><ChevronRight size={18} color={Brand.textSecondary} />
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.choice} onPress={() => { setOpponent(null); setStep(3); }}>
        <Swords size={21} color={Brand.cyan} /><View style={styles.flex}><Text style={styles.label}>Dejar abierta</Text>
          <Text style={styles.muted}>Publica la partida para que otro jugador pueda unirse.</Text></View><ChevronRight size={18} color={Brand.textSecondary} />
      </Pressable>
    </View>}

    {step === 2 && <>
      <Text accessibilityRole="header" style={styles.title}>Elige a tu rival</Text>
      <View style={styles.field}><Search size={18} color={Brand.textSecondary} /><TextInput style={styles.input} placeholder="Buscar jugador"
        placeholderTextColor={Brand.textSecondary} value={query} onChangeText={setQuery} accessibilityLabel="Buscar jugador" /></View>
      <PillTabs options={circleOptions} selected={circle} onSelect={(value) => { setCircle(value); setOpponent(null); }} />
      <FlatList data={rivals.loading || rivals.error ? [] : visible} style={styles.flex}
        keyExtractor={(item) => String(item.id)} keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: item.id === selectedRival?.id }}
          style={[styles.choice, item.id === selectedRival?.id && styles.selected]} onPress={() => setOpponent(item)}>
          {item.player ? <PlayerIdentity player={item.player} showRating /> : <Text style={styles.label}>{item.name}</Text>}
          {!!item.groupName && <Text style={styles.muted}>{item.groupName}</Text>}
        </Pressable>}
        ListEmptyComponent={<View style={styles.empty}>
          {rivals.loading ? <Text style={styles.muted}>Cargando jugadores…</Text> :
            <MatchState title={rivals.error ? 'No pudimos cargar los jugadores' : 'No encontramos jugadores'} art={rivals.error?.isNetwork ? matchArt.offline : matchArt.search}>
              {!!rivals.error && <AuthButton label="Reintentar" onPress={rivals.refetch} />}
            </MatchState>}
        </View>} />
      <View style={styles.footer}><AuthButton label="Continuar" disabled={!selectedRival || rivals.loading || !!rivals.error}
        onPress={() => { if (selectedRival) { setOpponent(selectedRival); setStep(3); } }} /></View>
    </>}

    {step === 3 && <>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.stack}>
        <Text accessibilityRole="header" style={styles.title}>¿Dónde y cuándo?</Text>
        {placesAvailable && <View style={styles.venue}>
          <Text style={styles.label}>Lugar</Text>
          <View style={styles.field}><MapPin size={18} color={Brand.textSecondary} /><TextInput style={styles.input}
            placeholder="Busca una dirección o un lugar" placeholderTextColor={Brand.textSecondary} value={placeQuery}
            accessibilityLabel="Lugar" onChangeText={(value) => { setPlaceQuery(value); setPlace(undefined); setSuggestions([]); }} /></View>
          {!!suggestions.length && <View style={styles.suggestions}>
            {suggestions.slice(0, 4).map((item) => <Pressable key={item.placeId} accessibilityRole="button" style={styles.suggestion}
              disabled={resolvingPlace} onPress={() => { void selectPlace(item); }}><Text style={styles.label} numberOfLines={2}>{item.description}</Text></Pressable>)}
          </View>}
        </View>}
        <AuthButton label="Usar mi ubicación actual" icon={LocateFixed} variant="secondary" disabled={resolvingPlace} onPress={() => {
          setPlace(undefined); setPlaceQuery(''); setSuggestions([]); if (!coords) void retry();
        }} />
        {coords || place ? <Text style={styles.muted}>{address}</Text>
          : <LocationNotice status={status === 'ready' ? 'unavailable' : status} onRetry={retry} />}
        <Text style={styles.label}>Hora</Text>
        <ActionRow><AuthButton label="Ahora mismo" variant="secondary" icon={Clock} onPress={() => setTime(new Date())} />
          <View style={styles.field}><Text style={styles.label}>{clockText(time)}</Text></View></ActionRow>
      </ScrollView>
      <View style={styles.footer}><AuthButton label="Continuar" onPress={() => setStep(4)}
        disabled={(needsLocation && !chosenCoordinates) || resolvingPlace} /></View>
    </>}

    {step === 4 && <>
      <ScrollView contentContainerStyle={styles.stack}>
        <Text accessibilityRole="header" style={styles.title}>Formato de la partida</Text>
        <PillTabs options={formats} selected={format} onSelect={setFormat} />
        <View style={styles.panel}><Text style={styles.label}>Sets a 11 puntos</Text>
          <Text style={styles.muted}>Si empatan a 10, hacen falta 2 puntos de ventaja.</Text></View>
        <View style={[styles.panel, styles.selected]}>
          <Text style={styles.label}>Resumen</Text>
          <View style={styles.identity}>{opponent?.player ? <PlayerIdentity player={opponent.player} showRating />
            : <Text style={styles.label}>{opponent?.name ?? 'Partida abierta'}</Text>}</View>
          <MatchMeta icon={MapPin} text={address} />
          <MatchMeta icon={Clock} text={clockText(time)} />
          <MatchMeta icon={Swords} text={formatLabels[format]} />
        </View>
      </ScrollView>
      <View style={styles.footer}><AuthButton label="Crear partida" loading={busy} onPress={submit} /></View>
    </>}
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stack: { gap: 12, paddingBottom: 12 },
  footer: { paddingVertical: Spacing.three },
  back: { alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: 4 },
  step: { alignItems: 'center', gap: 9, paddingBottom: 16 },
  bars: { flexDirection: 'row', gap: 5 },
  bar: { flex: 1, height: 3, borderRadius: 3, backgroundColor: Brand.border },
  filled: { backgroundColor: Brand.red },
  title: { color: Brand.text, fontSize: 24, fontWeight: '800', marginBottom: 8 },
  field: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 12, borderColor: Brand.border, borderWidth: 1, backgroundColor: Brand.surface },
  input: { color: Brand.text, flex: 1, minHeight: 44 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, marginTop: 6, borderRadius: 14, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  selected: { borderColor: '#307D8A', backgroundColor: '#10252C' },
  label: { color: Brand.text, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  muted: { color: Brand.textSecondary, fontSize: 13, flexShrink: 1 },
  empty: { paddingVertical: 12 },
  venue: { gap: 6, zIndex: 2 },
  suggestions: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#232326', borderWidth: 1, borderColor: Brand.border, borderRadius: 12, elevation: 5 },
  suggestion: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: Brand.border },
  panel: { gap: 9, padding: 13, borderRadius: 14, borderColor: Brand.border, borderWidth: 1, backgroundColor: Brand.surface },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
