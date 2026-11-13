import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

export function CardLighting({ color, court = false }: { color: string; court?: boolean }) {
  const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={styles.diagonal}>
      <Svg width="100%" height="100%" viewBox="0 0 360 124" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={gradientId} cx="98%" cy="94%" rx="74%" ry="102%">
            <Stop offset="0" stopColor={color} stopOpacity={court ? 0.48 : 0.33} />
            <Stop offset="0.58" stopColor={color} stopOpacity={0.09} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="360" height="124" fill={`url(#${gradientId})`} />
        {court ? (
          <>
            <Ellipse cx={352} cy={125} rx={85} ry={16} fill={color} opacity={0.16} />
            <Path d="M235 124 L289 91 L360 75 M267 124 L360 95 M280 113 L360 90 M298 103 L298 124 M313 99 L314 124 M330 94 L331 124 M348 90 L350 124" stroke={color} strokeWidth={1} strokeOpacity={0.38} fill="none" />
            <Path d="M286 92 L360 75" stroke={color} strokeWidth={3} strokeOpacity={0.85} fill="none" />
          </>
        ) : null}
      </Svg>
      <View style={[styles.stripe, { backgroundColor: color }]} />
      <View style={[styles.stripe, styles.thinStripe, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  diagonal: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  stripe: { position: 'absolute', right: 26, top: -65, width: 30, height: 260, transform: [{ rotate: '38deg' }], opacity: 0.15 },
  thinStripe: { right: 12, width: 8, opacity: 0.23 },
});
