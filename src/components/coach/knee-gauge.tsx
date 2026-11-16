import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Brand } from '@/constants/theme';

const SIZE = 140;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const IDEAL = { min: 120, max: 150 };

const arc = (fromDegrees: number, toDegrees: number) => {
  const length = (CIRCUMFERENCE * (toDegrees - fromDegrees)) / 180 / 2;
  const offset = -(CIRCUMFERENCE * fromDegrees) / 180 / 2;
  return { strokeDasharray: `${length} ${CIRCUMFERENCE}`, strokeDashoffset: offset };
};

export function KneeGauge({ angle }: { angle: number | null }) {
  const value = angle === null ? null : Math.min(180, Math.max(0, Math.round(angle)));
  const inIdeal = value !== null && value >= IDEAL.min && value <= IDEAL.max;
  const color = value === null ? Brand.textSecondary : inIdeal ? '#2ECC71' : '#FFD278';

  return (
    <View style={styles.wrapper} accessible accessibilityLabel={value === null ? 'Ángulo de rodilla no disponible' : `Ángulo de rodilla: ${value} grados${inIdeal ? ', dentro del rango ideal' : ''}`}>
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={Brand.border} strokeWidth={STROKE} fill="none" {...arc(0, 180)} strokeLinecap="round" />
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="rgba(46,204,113,0.35)" strokeWidth={STROKE} fill="none" {...arc(IDEAL.min, IDEAL.max)} />
        {value !== null && <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={color} strokeWidth={STROKE} fill="none" {...arc(0, value)} strokeLinecap="round" />}
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, { color }]}>{value === null ? '—' : `${value}°`}</Text>
        <Text style={styles.caption}>Rodillas</Text>
      </View>
      <Text style={styles.ideal}>Ideal {IDEAL.min}°–{IDEAL.max}°</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  svg: { transform: [{ rotate: '180deg' }] },
  center: { position: 'absolute', top: 0, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 30, fontWeight: '900', fontVariant: ['tabular-nums'] },
  caption: { color: Brand.textSecondary, fontSize: 12, fontWeight: '700' },
  ideal: { color: Brand.textSecondary, fontSize: 12, marginTop: 4 },
});
