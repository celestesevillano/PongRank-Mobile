import * as Location from 'expo-location';
import { MapPin } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { Brand, Spacing } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

function format(place: Location.LocationGeocodedAddress) {
  const street = [place.street ?? place.name, place.streetNumber].filter(Boolean).join(' ');
  return [street, place.district, place.city ?? place.subregion, place.region].filter(Boolean).join(', ');
}

// Dirección con ayudas: escribir, buscar coincidencias o usar la ubicación actual (sin claves de mapas).
export function AddressField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [options, setOptions] = useState<string[]>([]);
  const [busy, setBusy] = useState<'search' | 'locate' | null>(null);
  const [message, setMessage] = useState('');

  const picked = useRef(false);
  const term = useDebouncedValue(value.trim(), 700);

  // Sugerencias mientras se escribe (geocodificador del dispositivo)
  useEffect(() => {
    if (picked.current || term.length < 4) { setOptions([]); return; }
    let cancelled = false;
    setBusy('search');
    setMessage('');
    (async () => {
      try {
        const found = await Location.geocodeAsync(term);
        const labels = await Promise.all(found.slice(0, 3).map(async (point) => {
          const [place] = await Location.reverseGeocodeAsync(point);
          return place ? format(place) : '';
        }));
        if (cancelled) return;
        const unique = [...new Set(labels.filter(Boolean))];
        setOptions(unique);
        if (unique.length === 0) setMessage('No encontramos esa dirección. Puedes escribirla tal como la conoces.');
      } catch {
        if (!cancelled) setMessage('No pudimos buscar sugerencias. Escribe la dirección manualmente.');
      } finally {
        if (!cancelled) setBusy((current) => (current === 'search' ? null : current));
      }
    })();
    return () => { cancelled = true; };
  }, [term]);

  const locate = async () => {
    if (busy) return;
    setBusy('locate');
    setMessage('');
    setOptions([]);
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        setMessage('Activa el permiso de ubicación para usar esta opción, o escribe la dirección.');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync(coords);
      if (place) { picked.current = true; setOptions([]); onChange(format(place)); }
      else setMessage('No pudimos obtener la dirección de tu ubicación.');
    } catch {
      setMessage('No pudimos obtener tu ubicación. Escribe la dirección.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <AuthInput accessibilityLabel="Dirección" placeholder="Calle, número y distrito" value={value} maxLength={250}
        onChangeText={(text) => { picked.current = false; onChange(text); setMessage(''); }} />
      <AuthButton label="Usar mi ubicación" icon={MapPin} variant="secondary" loading={busy === 'locate'} onPress={locate} />
      {options.map((option) => (
        <Pressable key={option} accessibilityRole="button" style={styles.option} onPress={() => { picked.current = true; onChange(option); setOptions([]); }}>
          <MapPin size={16} color={Brand.cyan} />
          <Text style={styles.optionText}>{option}</Text>
        </Pressable>
      ))}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  option: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 44, paddingHorizontal: Spacing.three, borderRadius: 12, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  optionText: { color: Brand.text, flex: 1, fontSize: 14 },
  message: { color: Brand.textSecondary, fontSize: 13 },
});
