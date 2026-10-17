import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import type { Coordinates } from '@/services/matches.service';

export type LocationStatus = 'loading' | 'ready' | 'denied' | 'unavailable';

export function useLocation() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<LocationStatus>('loading');

  const locate = useCallback(async () => {
    setStatus('loading');
    try {
      if (!(await Location.hasServicesEnabledAsync())) {
        setStatus('unavailable');
        return;
      }
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        setStatus('denied');
        return;
      }
      const { coords: position } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: position.latitude, longitude: position.longitude });
      setStatus('ready');
    } catch {
      setStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  return { coords, setCoords, status, retry: locate };
}
