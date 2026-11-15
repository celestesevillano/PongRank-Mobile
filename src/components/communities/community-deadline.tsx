import { Clock3 } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';

const HOUR = 60 * 60 * 1000;
export const COMMUNITY_EXPIRY_WARNING = 72 * HOUR;

export function useCommunityDeadline(deadline?: string | null, serverTime?: string, onEnd?: () => void) {
  const parse = (value?: string | null) => value ? Date.parse(value) : NaN;
  const [baseline, setBaseline] = useState({ deadline, serverTime, receivedAt: Date.now() });
  const [now, setNow] = useState(Date.now);
  const notified = useRef<string | null>(null);

  useEffect(() => {
    setBaseline({ deadline, serverTime, receivedAt: Date.now() });
    setNow(Date.now());
    if (!deadline) return;
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [deadline, serverTime]);

  const end = parse(deadline);
  const server = parse(serverTime);
  const current = Number.isFinite(server) ? server + now - baseline.receivedAt : now;
  const remaining = baseline.deadline === deadline && baseline.serverTime === serverTime && Number.isFinite(end)
    ? end - current : null;

  useEffect(() => {
    if (!deadline || remaining === null || remaining > 0 || !onEnd || notified.current === deadline) return;
    notified.current = deadline;
    onEnd();
  }, [deadline, onEnd, remaining]);

  return remaining;
}

export function CommunityDeadline({ title, remaining, variant = 'compact' }: {
  title?: string; remaining: number; variant?: 'compact' | 'prominent';
}) {
  const prominent = variant === 'prominent';
  const totalHours = Math.ceil(Math.max(0, remaining) / HOUR);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const dayLabel = days === 1 ? '1 día' : `${days} días`;
  const hourLabel = hours === 1 ? '1 hora' : `${hours} horas`;
  const label = totalHours === 0 ? 'Plazo vencido' : days ? (hours ? `${dayLabel} y ${hours} h` : dayLabel) : hourLabel;

  if (prominent) {
    return (
      <View style={[styles.notice, styles.prominent]}>
        <View style={styles.clock}><Clock3 size={24} color="#FFD278" /></View>
        <Text style={[styles.remaining, styles.prominentTime]}>{label}</Text>
        {title && <Text style={styles.timeNote}>{title}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.notice}>
      <View style={styles.label}>
        <Clock3 size={16} color="#FFD278" />
        {title && <Text style={styles.title}>{title}</Text>}
      </View>
      <Text style={styles.remaining}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
    gap: Spacing.two, alignSelf: 'stretch' },
  prominent: { flexDirection: 'column', justifyContent: 'center' },
  label: { flexDirection: 'row', flexShrink: 1, alignItems: 'center', gap: 6 },
  clock: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFD27818' },
  timeNote: { color: Brand.textSecondary, fontSize: 14 },
  title: { color: Brand.text, flexShrink: 1, fontSize: 14, fontWeight: '700' },
  remaining: { color: '#FFD278', fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  prominentTime: { fontSize: 36 },
});
