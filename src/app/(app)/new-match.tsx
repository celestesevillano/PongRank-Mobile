import { router } from 'expo-router';
import { ChevronRight, Clock, MapPin, Search, Users } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { LocationNotice } from '@/components/common/location-notice';
import { ScreenContainer } from '@/components/common/screen-container';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useLocation } from '@/hooks/use-location';
import { friendOf, friendshipsService } from '@/services/friendships.service';
import { matchesService, type MatchCreateInput } from '@/services/matches.service';
import { placesAvailable, placesService, type PlaceSuggestion } from '@/services/places.service';
import type { MatchResponse, PlayerSummary } from '@/types/api';
import { toApiError } from '@/utils/api-error';

const FORMATS: { label: string; value: MatchCreateInput['format'] }[] = [
  { label: 'Mejor de 3', value: 'BO3' },
  { label: 'Mejor de 5', value: 'BO5' },
  { label: 'Mejor de 7', value: 'BO7' },
];

type Step = 'who' | 'where' | 'format' | 'waiting';
const STEP_TITLE: Record<Step, string> = { who: 'Crear partida', where: 'Crear partida', format: 'Crear partida', waiting: 'Partida publicada' };

export default function NewMatchScreen() {
  const { player } = useSession();
  const { showToast } = useToast();
  const { coords, setCoords, status, retry } = useLocation();
  const [step, setStep] = useState<Step>('who');
  const [opponent, setOpponent] = useState<PlayerSummary | null>(null);
  const [friends, setFriends] = useState<PlayerSummary[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendQuery, setFriendQuery] = useState('');
  const [format, setFormat] = useState<MatchCreateInput['format']>('BO3');
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<MatchResponse | null>(null);
  const debouncedQuery = useDebouncedValue(placeQuery, 350);

  useEffect(() => {
    if (!player) return;
    const controller = new AbortController();
    friendshipsService
      .accepted(player.id, controller.signal)
      .then((list) => setFriends(list.map((f) => friendOf(f, player.id))))
      .catch(() => setFriends([]))
      .finally(() => setFriendsLoading(false));
    return () => controller.abort();
  }, [player]);

  useEffect(() => {
    if (!placesAvailable || debouncedQuery.trim().length < 3 || placeLabel) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    placesService
      .autocomplete(debouncedQuery.trim(), controller.signal)
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
    return () => controller.abort();
  }, [debouncedQuery, placeLabel]);

  const visibleFriends = useMemo(
    () => friends.filter((friend) => friend.name.toLowerCase().includes(friendQuery.trim().toLowerCase())),
    [friends, friendQuery],
  );

  const pickPlace = async (suggestion: PlaceSuggestion) => {
    try {
      setCoords(await placesService.coordinates(suggestion.placeId));
      setPlaceLabel(suggestion.description);
      setPlaceQuery(suggestion.description);
      setSuggestions([]);
    } catch {
      showToast('No pudimos usar ese lugar. Intenta con otro.', 'error');
    }
  };

  // Contra un amigo la ubicación es opcional; una partida abierta la necesita para que otros la encuentren.
  const canLeaveWhere = opponent !== null || coords !== null;

  const submit = async () => {
    setSubmitting(true);
    try {
      const match = await matchesService.create(
        opponent
          ? { matchType: 'FRIEND', format, opponentId: opponent.id, ...(coords ?? {}) }
          : { matchType: 'LOCATION', format, ...coords },
      );
      setCreated(match);
      setStep('waiting');
    } catch (err) {
      showToast(toApiError(err).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async () => {
    if (!created) return;
    try {
      await matchesService.cancel(created.id);
      showToast('Partida cancelada.');
    } catch (err) {
      showToast(toApiError(err).message, 'error');
    }
    router.replace('/matches');
  };

  const goBack = () => {
    if (step === 'where') setStep('who');
    else if (step === 'format') setStep('where');
    else router.back();
  };

  return (
    <ScreenContainer title={STEP_TITLE[step]}>
      {step !== 'waiting' && (
        <Pressable onPress={goBack} hitSlop={12}>
          <Text style={styles.back}>‹ Volver</Text>
        </Pressable>
      )}

      {step === 'who' && (
        <>
          <Text style={styles.section}>¿Contra quién?</Text>
          <View style={styles.searchBox}>
            <Search color={Brand.textSecondary} size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar un amigo"
              placeholderTextColor={Brand.textSecondary}
              value={friendQuery}
              onChangeText={setFriendQuery}
            />
          </View>
          {friendsLoading ? (
            <ActivityIndicator color={Brand.red} style={styles.loader} />
          ) : visibleFriends.length === 0 ? (
            <Text style={styles.hint}>{friends.length === 0 ? 'Aún no tienes amigos agregados.' : 'No hay amigos con ese nombre.'}</Text>
          ) : (
            visibleFriends.map((friend) => (
              <Pressable
                key={friend.id}
                style={styles.row}
                onPress={() => {
                  setOpponent(friend);
                  setStep('where');
                }}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{friend.name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{friend.name}</Text>
                  <Text style={styles.rating}>{Math.round(friend.ratingGlicko)}</Text>
                </View>
                <ChevronRight color={Brand.textSecondary} size={18} />
              </Pressable>
            ))
          )}
          <Pressable
            style={styles.row}
            onPress={() => {
              setOpponent(null);
              setStep('where');
            }}
          >
            <View style={styles.avatar}>
              <Users color={Brand.textSecondary} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Dejar abierta</Text>
              <Text style={styles.hint}>Cualquiera de nivel similar podrá unirse</Text>
            </View>
            <ChevronRight color={Brand.textSecondary} size={18} />
          </Pressable>
        </>
      )}

      {step === 'where' && (
        <>
          <Text style={styles.section}>¿Dónde y cuándo?</Text>
          {placesAvailable && (
            <>
              <TextInput
                style={styles.input}
                placeholder={opponent ? 'Buscar ubicación (opcional)' : 'Buscar ubicación'}
                placeholderTextColor={Brand.textSecondary}
                value={placeQuery}
                onChangeText={(text) => {
                  setPlaceQuery(text);
                  setPlaceLabel(null);
                }}
              />
              {suggestions.map((suggestion) => (
                <Pressable key={suggestion.placeId} style={styles.suggestion} onPress={() => pickPlace(suggestion)}>
                  <Text style={styles.suggestionText}>{suggestion.description}</Text>
                </Pressable>
              ))}
            </>
          )}
          {coords ? (
            <Text style={styles.hint}>{placeLabel ? `Lugar elegido: ${placeLabel}` : 'Usaremos tu ubicación actual.'}</Text>
          ) : (
            <LocationNotice status={status === 'ready' ? 'unavailable' : status} onRetry={retry} />
          )}
          <View style={styles.when}>
            <Clock color={Brand.red} size={18} />
            <Text style={styles.whenText}>Ahora mismo</Text>
          </View>
          <Text style={styles.hint}>Programar la hora llegará más adelante.</Text>
          <AuthButton label="Siguiente" disabled={!canLeaveWhere} onPress={() => setStep('format')} style={styles.submit} />
        </>
      )}

      {step === 'format' && (
        <>
          <Text style={styles.section}>Formato del partido</Text>
          <View style={styles.formats}>
            {FORMATS.map((item) => (
              <Pressable key={item.value} onPress={() => setFormat(item.value)} style={[styles.format, format === item.value && styles.formatActive]}>
                <Text style={styles.formatLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.hint}>Cada set se juega a 11 puntos. Si hay empate en 10, gana quien saque 2 puntos de ventaja.</Text>

          <View style={styles.summary}>
            <Text style={styles.rowTitle}>Resumen de tu partida</Text>
            <SummaryRow label="Oponente" value={opponent ? opponent.name : 'Partida abierta'} />
            <SummaryRow label="Ubicación" value={placeLabel ?? (coords ? 'Tu ubicación actual' : 'Sin ubicación')} />
            <SummaryRow label="Cuándo" value="Ahora mismo" />
          </View>
          <AuthButton label="Crear partida" loading={submitting} onPress={submit} style={styles.submit} />
        </>
      )}

      {step === 'waiting' && (
        <View style={styles.waiting}>
          <View style={styles.clock}>
            <Clock color="#F5A524" size={48} />
          </View>
          <Text style={styles.waitingTitle}>{opponent ? `Esperando a ${opponent.name}...` : 'Esperando rival...'}</Text>
          <Text style={styles.hint}>
            {opponent ? 'Tu rival recibirá la invitación y podrá aceptarla.' : 'Tu partida está publicada y visible para otros jugadores.'}
          </Text>
          <View style={styles.summary}>
            <SummaryRow label="Formato" value={FORMATS.find((f) => f.value === format)?.label ?? ''} />
            <View style={styles.summaryRow}>
              <MapPin color={Brand.red} size={14} />
              <Text style={styles.summaryValue}>{placeLabel ?? 'Tu ubicación actual'}</Text>
            </View>
          </View>
          <AuthButton label="Ver mis partidas" onPress={() => router.replace('/matches')} style={styles.submit} />
          <Pressable onPress={cancel} hitSlop={12}>
            <Text style={styles.cancel}>Cancelar partida</Text>
          </Pressable>
        </View>
      )}
    </ScreenContainer>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { color: Brand.textSecondary, marginBottom: Spacing.three },
  section: { color: Brand.text, fontSize: 18, fontWeight: '700', marginTop: Spacing.two, marginBottom: Spacing.two },
  input: { backgroundColor: Brand.surface, borderRadius: Spacing.three, borderWidth: 1, borderColor: Brand.border, color: Brand.text, padding: Spacing.three },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Brand.surface,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  searchInput: { flex: 1, color: Brand.text, paddingVertical: Spacing.three },
  loader: { marginVertical: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    marginTop: Spacing.two,
    backgroundColor: Brand.surface,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  rowTitle: { color: Brand.text, fontSize: 15, fontWeight: '700' },
  rating: { color: Brand.red, fontSize: 13, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Brand.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Brand.text, fontWeight: '700' },
  suggestion: { paddingVertical: Spacing.two, borderBottomWidth: 1, borderBottomColor: Brand.border },
  suggestionText: { color: Brand.text },
  hint: { color: Brand.textSecondary, fontSize: 13, marginTop: Spacing.two },
  when: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    borderColor: Brand.red,
    backgroundColor: 'rgba(232, 38, 47, 0.12)',
  },
  whenText: { color: Brand.text, fontWeight: '600' },
  formats: { flexDirection: 'row', gap: Spacing.two },
  format: { flex: 1, alignItems: 'center', paddingVertical: Spacing.three, borderRadius: Spacing.three, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  formatActive: { borderColor: Brand.red },
  formatLabel: { color: Brand.text, fontWeight: '600' },
  summary: { marginTop: Spacing.three, padding: Spacing.three, gap: Spacing.two, backgroundColor: Brand.surface, borderRadius: Spacing.three, borderWidth: 1, borderColor: Brand.border },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  summaryLabel: { color: Brand.textSecondary, fontSize: 13 },
  summaryValue: { color: Brand.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  submit: { marginTop: Spacing.four },
  waiting: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.four },
  clock: { width: 104, height: 104, borderRadius: 52, borderWidth: 2, borderColor: '#F5A524', alignItems: 'center', justifyContent: 'center' },
  waitingTitle: { color: Brand.text, fontSize: 24, fontWeight: '700', marginTop: Spacing.three, textAlign: 'center' },
  cancel: { color: Brand.red, fontWeight: '600', marginTop: Spacing.three },
});
