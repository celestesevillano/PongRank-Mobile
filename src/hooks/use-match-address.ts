import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

const addresses = new Map<string, Promise<string | null>>();

export function resolveMatchAddress(latitude: number, longitude: number) {
  const key = `${latitude},${longitude}`;
  const previous = addresses.get(key);
  if (previous) return previous;
  const pending = Location.getForegroundPermissionsAsync().then(async ({ granted }) => {
    if (!granted) return null;
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!address) return null;
    return [address.street ? [address.street, address.streetNumber].filter(Boolean).join(' ') : address.name,
      address.district ?? address.city].filter(Boolean).join(', ') || null;
  }).catch(() => null);
  addresses.set(key, pending);
  void pending.then((address) => { if (!address) addresses.delete(key); });
  if (addresses.size > 64) addresses.delete(addresses.keys().next().value ?? '');
  return pending;
}

export function useMatchAddress(latitude?: number | null, longitude?: number | null) {
  const [result, setResult] = useState<{ latitude: number; longitude: number; address: string | null }>();
  useEffect(() => {
    if (latitude == null || longitude == null) return;
    let active = true;
    void resolveMatchAddress(latitude, longitude).then((address) => {
      if (active) setResult({ latitude, longitude, address });
    });
    return () => { active = false; };
  }, [latitude, longitude]);
  return result && result.latitude === latitude && result.longitude === longitude ? result.address : null;
}
