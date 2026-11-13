import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { Brand, Spacing } from '@/constants/theme';
import { STATISTICS_PERIODS, type RatingPoint, type StatisticsPeriod } from '@/utils/statistics';

export const STAT_CYAN = '#22D3EE';

const shortDate = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' });
const PLOT_HEIGHT = 104;
const INSET = 8;

type RatingChartProps = {
  period: StatisticsPeriod;
  onPeriodChange: (period: StatisticsPeriod) => void;
  points: RatingPoint[];
  incomplete: boolean;
};

export function signedRating(value: number) {
  const rounded = Math.round(value);
  return rounded > 0 ? `+${rounded}` : rounded < 0 ? `−${-rounded}` : '0';
}

export function RatingChart({ period, onPeriodChange, points, incomplete }: RatingChartProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TrendingUp size={22} color={STAT_CYAN} />
        <Text accessibilityRole="header" style={styles.title}>Evolución del rating</Text>
      </View>
      <View style={styles.filters}>
        {STATISTICS_PERIODS.map((item) => (
          <Pressable
            key={item}
            onPress={() => onPeriodChange(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: item === period }}
            style={({ pressed }) => [styles.filter, item === period && styles.selected, pressed && styles.pressed]}>
            <Text style={[styles.filterLabel, item === period && styles.selectedLabel]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {points.length > 0 ? <RatingPlot key={period} points={points} /> : null}
      {incomplete ? (
        <Text style={styles.message}>
          {points.length > 0 ? 'Se muestra el historial de rating que se pudo reconstruir.' : 'Aún no está disponible el historial de rating de este periodo.'}
        </Text>
      ) : points.length === 0 ? <Text style={styles.message}>Sin partidas confirmadas en este periodo.</Text> : null}
    </View>
  );
}

function RatingPlot({ points }: { points: RatingPoint[] }) {
  const [width, setWidth] = useState(0);
  const [selectedId, setSelectedId] = useState<number>();
  const lastIndex = points.length - 1;
  const selectedIndex = points.findIndex(({ id }) => id === selectedId);
  const index = selectedIndex < 0 ? lastIndex : selectedIndex;
  const point = points[index];
  const first = points[0];
  const last = points[lastIndex];

  let lowest = point.rating;
  let highest = point.rating;
  for (const entry of points) {
    lowest = Math.min(lowest, entry.rating);
    highest = Math.max(highest, entry.rating);
  }
  const step = Math.max(10, Math.ceil((highest - lowest) / 30) * 10);
  const top = Math.ceil(highest / step) * step;
  const labels = [top, top - step, top - step * 2, top - step * 3];
  // Preserve the lower bound even when the upper value rounds up by almost a full step.
  if (labels[3] > lowest) {
    labels.push(top - step * 4);
  }
  const bottom = labels[labels.length - 1];
  const coords = points.map((entry, i) => ({
    x: INSET + (width - 2 * INSET) * (last.date === first.date
      ? (lastIndex === 0 ? 0.5 : i / lastIndex)
      : (entry.date - first.date) / (last.date - first.date)),
    y: INSET + PLOT_HEIGHT * (top - entry.rating) / (top - bottom),
  }));
  const path = coords.map(({ x, y }, i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
  const selected = coords[index];

  return (
    <Animated.View entering={FadeIn.duration(160).reduceMotion(ReduceMotion.System)} style={styles.plot}>
      <View style={styles.plotRow}>
        <View importantForAccessibility="no-hide-descendants" style={styles.axis}>
          {labels.map((label) => <Text key={label} style={styles.axisLabel}>{label}</Text>)}
        </View>
        <Pressable
          accessible={false}
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          onPress={(event) => {
            const x = event.nativeEvent.locationX;
            const nearest = coords.reduce((best, candidate, i) =>
              Math.abs(candidate.x - x) <= Math.abs(coords[best].x - x) ? i : best, 0);
            setSelectedId(points[nearest].id);
          }}
          style={styles.canvas}>
          {width > INSET * 2 ? (
            <View pointerEvents="none">
              <Svg width={width} height={PLOT_HEIGHT + 2 * INSET}>
                <Defs>
                  <LinearGradient id="ratingArea" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={STAT_CYAN} stopOpacity={0.32} />
                    <Stop offset="1" stopColor={STAT_CYAN} stopOpacity={0.02} />
                  </LinearGradient>
                </Defs>
                {labels.map((label) => {
                  const y = INSET + PLOT_HEIGHT * (top - label) / (top - bottom);
                  return <Line key={label} x1={0} x2={width} y1={y} y2={y} stroke="#37464C" strokeDasharray="4 4" />;
                })}
                {points.length > 1 ? (
                  <>
                    <Path d={`${path} L${coords[lastIndex].x} ${PLOT_HEIGHT + INSET} L${coords[0].x} ${PLOT_HEIGHT + INSET} Z`} fill="url(#ratingArea)" />
                    <Path d={path} stroke={STAT_CYAN} strokeWidth={2.5} strokeLinejoin="round" fill="none" />
                  </>
                ) : null}
                {points.length <= 32 ? coords.map(({ x, y }, i) => (
                  <Circle key={points[i].id} cx={x} cy={y} r={3} fill={STAT_CYAN} />
                )) : null}
                <Line x1={selected.x} x2={selected.x} y1={selected.y} y2={PLOT_HEIGHT + INSET} stroke={STAT_CYAN} strokeOpacity={0.55} strokeDasharray="3 3" />
                <Circle cx={selected.x} cy={selected.y} r={6} fill={Brand.background} stroke={STAT_CYAN} strokeWidth={2} />
                <Circle cx={selected.x} cy={selected.y} r={2.5} fill={Brand.text} />
              </Svg>
            </View>
          ) : null}
        </Pressable>
      </View>
      {first.date !== last.date ? (
        <View style={styles.dates}>
          <Text style={styles.axisLabel}>{shortDate.format(first.date)}</Text>
          <Text style={styles.axisLabel}>{shortDate.format(last.date)}</Text>
        </View>
      ) : null}
      <View style={styles.tooltip}>
        <PointButton direction="previous" disabled={index === 0} onPress={() => setSelectedId(points[index - 1].id)} />
        <View accessibilityLiveRegion="polite" style={styles.pointDetails}>
          <Text style={styles.axisLabel}>{shortDate.format(point.date)}</Text>
          <Text style={styles.pointRating}>
            {Math.round(point.rating)} <Text style={{ color: point.delta < 0 ? '#FF8990' : STAT_CYAN }}>{signedRating(point.delta)} pts</Text>
          </Text>
        </View>
        <PointButton direction="next" disabled={index === lastIndex} onPress={() => setSelectedId(points[index + 1].id)} />
      </View>
    </Animated.View>
  );
}

function PointButton({ direction, disabled, onPress }: { direction: 'previous' | 'next'; disabled: boolean; onPress: () => void }) {
  const previous = direction === 'previous';
  const Icon = previous ? ChevronLeft : ChevronRight;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={previous ? 'Punto anterior' : 'Punto siguiente'}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.pointButton, disabled && styles.disabled, pressed && styles.pressed]}>
      <Icon size={18} color={STAT_CYAN} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, backgroundColor: '#101519', borderRadius: 16, borderWidth: 1, borderColor: '#344047', gap: Spacing.two },
  header: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  title: { flex: 1, color: Brand.text, fontSize: 18, fontWeight: '800' },
  filters: { flexDirection: 'row', gap: Spacing.two },
  filter: { flex: 1, minHeight: 44, borderRadius: 22, borderColor: '#344047', borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.one },
  selected: { backgroundColor: '#D81E28', borderColor: Brand.red },
  filterLabel: { color: '#B8BDC3', fontWeight: '600', textAlign: 'center' },
  selectedLabel: { color: Brand.text },
  pressed: { opacity: 0.75 },
  message: { color: '#B8BDC3', paddingVertical: Spacing.two, fontSize: 14 },
  plot: { gap: Spacing.one },
  plotRow: { flexDirection: 'row', alignItems: 'stretch', gap: Spacing.two },
  axis: { justifyContent: 'space-between' },
  axisLabel: { color: '#B8BDC3', fontSize: 12, fontVariant: ['tabular-nums'] },
  canvas: { flex: 1, minHeight: PLOT_HEIGHT + INSET * 2 },
  dates: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 40 },
  tooltip: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#215360', backgroundColor: '#0A2229' },
  pointDetails: { flex: 1, alignItems: 'center', paddingVertical: Spacing.one },
  pointRating: { color: Brand.text, fontSize: 14, fontWeight: '700', textAlign: 'center', fontVariant: ['tabular-nums'] },
  pointButton: { width: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  disabled: { opacity: 0.25 },
});
