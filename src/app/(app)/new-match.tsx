import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { LocationNotice } from '@/components/common/location-notice';
import { ScreenContainer } from '@/components/common/screen-container';
import { Brand, Spacing } from '@/constants/theme';
import { useToast } from '@/context/toast';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useLocation } from '@/hooks/use-location';
import { matchesService, type MatchCreateInput } from '@/services/matches.service';
import { placesAvailable, placesService, type PlaceSuggestion } from '@/services/places.service';
import { toApiError } from '@/utils/api-error';

const FORMATS: { label: string; value: MatchCreateInput['format'] }[] = [
  { label: 'Mejor de 3', value: 'BO3' },
  { label: 'Mejor de 5', value: 'BO5' },
  { label: 'Mejor de 7', value: 'BO7' },
];

export default function NewMatchScreen() {
  const { showToast } = useToast();
  const { coords, setCoords, status, retry } = useLocation();
  const [format, setFormat] = useState<MatchCreateInput['format']>('BO3');
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const debouncedQuery = useDebouncedValue(placeQuery, 350);

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

  const submit = async () => {
    if (!coords) return;
    setSubmitting(true);
    try {
      await matchesService.create({ matchType: 'LOCATION', format, ...coords });
      showToast('Partida publicada. Esperando rival.');
      router.replace('/matches');
    } catch (err) {
      showToast(toApiError(err).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer title="Crear partida">
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.back}>‹ Volver</Text>
      </Pressable>

      <Text style={styles.section}>¿Dónde?</Text>
      {placesAvailable && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Buscar ubicación (opcional)"
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

      <Text style={styles.section}>Formato</Text>
      <View style={styles.formats}>
        {FORMATS.map((item) => (
          <Pressable key={item.value} onPress={() => setFormat(item.value)} style={[styles.format, format === item.value && styles.formatActive]}>
            <Text style={styles.formatLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>Cada set se juega a 11 puntos. Si hay empate en 10, gana quien saque 2 puntos de ventaja.</Text>

      <AuthButton label="Crear partida" disabled={!coords} loading={submitting} onPress={submit} style={styles.submit} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { color: Brand.textSecondary, marginBottom: Spacing.three },
  section: { color: Brand.text, fontSize: 18, fontWeight: '700', marginTop: Spacing.three, marginBottom: Spacing.two },
  input: { backgroundColor: Brand.surface, borderRadius: Spacing.three, borderWidth: 1, borderColor: Brand.border, color: Brand.text, padding: Spacing.three },
  suggestion: { paddingVertical: Spacing.two, borderBottomWidth: 1, borderBottomColor: Brand.border },
  suggestionText: { color: Brand.text },
  hint: { color: Brand.textSecondary, fontSize: 13, marginTop: Spacing.two },
  formats: { flexDirection: 'row', gap: Spacing.two },
  format: { flex: 1, alignItems: 'center', paddingVertical: Spacing.three, borderRadius: Spacing.three, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  formatActive: { borderColor: Brand.red },
  formatLabel: { color: Brand.text, fontWeight: '600' },
  submit: { marginTop: Spacing.four },
});
