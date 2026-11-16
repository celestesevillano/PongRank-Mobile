import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

const UPDATE_INTERVAL_MS = 100;
const WINDOW = 10;
const MAX_TILT_DEGREES = 20;
const MAX_ROLL_DEGREES = 12;
const MAX_JITTER = 0.04;

export type DeviceLevel =
  | { status: 'checking' | 'unavailable' }
  | { status: 'ready'; tilt: number; roll: number; stable: boolean; level: boolean };

const toDegrees = (radians: number) => (radians * 180) / Math.PI;

export function levelMessage(level: DeviceLevel) {
  if (level.status !== 'ready') return null;
  if (!level.level) {
    if (Math.abs(level.roll) > MAX_ROLL_DEGREES) return level.roll > 0 ? 'Gira el teléfono un poco a la izquierda' : 'Gira el teléfono un poco a la derecha';
    return 'Pon el teléfono más vertical';
  }
  if (!level.stable) return 'Apoya el teléfono y déjalo quieto';
  return null;
}

export function useDeviceLevel(enabled: boolean): DeviceLevel {
  const [level, setLevel] = useState<DeviceLevel>({ status: 'checking' });
  const magnitudes = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let subscription: { remove: () => void } | null = null;
    let cancelled = false;

    (async () => {
      const available = await Accelerometer.isAvailableAsync().catch(() => false);
      if (cancelled) return;
      if (!available) {
        setLevel({ status: 'unavailable' });
        return;
      }
      Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const magnitude = Math.hypot(x, y, z) || 1;
        const window = magnitudes.current;
        window.push(magnitude);
        if (window.length > WINDOW) window.shift();
        const spread = Math.max(...window) - Math.min(...window);
        const tilt = toDegrees(Math.acos(Math.min(1, Math.abs(y) / magnitude)));
        const roll = toDegrees(Math.atan2(x, Math.abs(y)));
        const stable = window.length === WINDOW && spread < MAX_JITTER;
        const next = { status: 'ready' as const, tilt: Math.round(tilt), roll: Math.round(roll), stable, level: tilt <= MAX_TILT_DEGREES && Math.abs(roll) <= MAX_ROLL_DEGREES };
        setLevel((prev) =>
          prev.status === 'ready' && prev.tilt === next.tilt && prev.roll === next.roll && prev.stable === next.stable ? prev : next,
        );
      });
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
      magnitudes.current = [];
    };
  }, [enabled]);

  return level;
}
