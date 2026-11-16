import { StyleSheet, Text, View } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';
import type { CoachExercise } from '@/constants/coach';
import type { LiveMetrics as LiveMetricsValue } from '@/hooks/use-coach-analysis';

export const scoreColor = (score: number | null) => (score === null ? Brand.textSecondary : score >= 75 ? '#2ECC71' : score >= 50 ? '#FFD278' : Brand.red);

export function LiveMetrics({ metrics, paused, exercise }: { metrics: LiveMetricsValue; paused: boolean; exercise: CoachExercise }) {
  return (
    <View style={styles.panel} accessibilityLiveRegion="polite">
      <Text style={[styles.tip, paused && styles.tipPaused]} numberOfLines={2}>
        {paused ? 'Análisis en pausa' : metrics.tip}
      </Text>
      <View style={styles.row}>
        <Metric label="Postura" value={metrics.postureScore === null ? '—' : `${metrics.postureScore}`} unit="/100" color={scoreColor(metrics.postureScore)} />
        {exercise === 'stance' ? (
          <Metric label="Rodillas" value={metrics.kneeAngle === null ? '—' : `${metrics.kneeAngle}`} unit="°" color={Brand.cyan} />
        ) : (
          <Metric label="Golpes" value={`${metrics.swings}`} unit="" color={Brand.cyan} />
        )}
        <Metric label="Swing máx." value={metrics.swingPeak.toFixed(1)} unit="m/s" color={Brand.cyan} />
      </View>
    </View>
  );
}

function Metric({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <View style={styles.metric} accessible accessibilityLabel={`${label}: ${value} ${unit}`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>
        {value}
        <Text style={styles.unit}> {unit}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', left: Spacing.three, right: Spacing.three, bottom: Spacing.three, gap: Spacing.two, padding: Spacing.three, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.72)', borderWidth: 1, borderColor: Brand.border },
  tip: { color: Brand.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  tipPaused: { color: Brand.textSecondary },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  metric: { flex: 1, alignItems: 'center' },
  label: { color: Brand.textSecondary, fontSize: 13, fontWeight: '700' },
  value: { fontSize: 30, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unit: { color: Brand.textSecondary, fontSize: 12, fontWeight: '600' },
});
