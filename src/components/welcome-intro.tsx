import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Brand, Spacing } from '@/constants/theme';

const IMPACT_AT_MS = 650;
const TOTAL_MS = 2600;

let alreadyPlayed = false;

export const INTRO_TOTAL_MS = TOTAL_MS;
export const introWillPlay = () => !alreadyPlayed;

export function WelcomeIntro() {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(!alreadyPlayed);

  const entry = useSharedValue(0);
  const shake = useSharedValue(0);
  const flash = useSharedValue(0);
  const ring = useSharedValue(0);
  const ringSlow = useSharedValue(0);
  const glow = useSharedValue(0.4);
  const title = useSharedValue(0);
  const overlay = useSharedValue(1);

  useEffect(() => {
    if (!visible) return;
    alreadyPlayed = true;
    const finish = () => setVisible(false);

    if (reduceMotion) {
      entry.value = 1;
      title.value = 1;
      overlay.value = withDelay(900, withTiming(0, { duration: 250 }, (done) => done && runOnJS(finish)()));
      return;
    }

    entry.value = withTiming(1, { duration: IMPACT_AT_MS, easing: Easing.out(Easing.back(1.6)) });
    glow.value = withSequence(
      withTiming(0.5, { duration: IMPACT_AT_MS }),
      withTiming(1, { duration: 200 }),
      withTiming(0.6, { duration: 900 }),
    );
    shake.value = withDelay(
      IMPACT_AT_MS,
      withSequence(
        withTiming(1, { duration: 60 }),
        withTiming(-1, { duration: 60 }),
        withTiming(0.6, { duration: 60 }),
        withTiming(-0.4, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      ),
    );
    flash.value = withDelay(IMPACT_AT_MS, withSequence(withTiming(1, { duration: 80 }), withTiming(0, { duration: 420 })));
    ring.value = withDelay(IMPACT_AT_MS, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
    ringSlow.value = withDelay(IMPACT_AT_MS + 150, withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }));
    title.value = withDelay(IMPACT_AT_MS + 250, withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) }));
    overlay.value = withDelay(TOTAL_MS - 350, withTiming(0, { duration: 350 }, (done) => done && runOnJS(finish)()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const paddleStyle = useAnimatedStyle(() => ({
    opacity: Math.min(entry.value * 2, 1),
    transform: [
      { perspective: 700 },
      { translateX: (1 - entry.value) * -170 + shake.value * 7 },
      { translateY: (1 - entry.value) * 90 + shake.value * -3 },
      { rotateY: `${(1 - entry.value) * 50}deg` },
      { rotateZ: `${(1 - entry.value) * -40 + shake.value * 2.5}deg` },
      { scale: 0.45 + entry.value * 0.55 },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.8 + glow.value * 0.5 }],
  }));

  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value * 0.55 }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ring.value) * (ring.value === 0 ? 0 : 1),
    transform: [{ scale: 0.3 + ring.value * 5 }],
  }));

  const ringSlowStyle = useAnimatedStyle(() => ({
    opacity: (1 - ringSlow.value) * (ringSlow.value === 0 ? 0 : 0.7),
    transform: [{ scale: 0.3 + ringSlow.value * 6.5 }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: title.value,
    transform: [{ translateY: (1 - title.value) * 18 }, { scale: 0.92 + title.value * 0.08 }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="auto">
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={[styles.flash, flashStyle]} pointerEvents="none" />
      <View style={styles.stage}>
        <Animated.View style={[styles.ring, ringSlowStyle]} />
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={paddleStyle}>
          <Image source={require('@/assets/images/pongrank-paddle.png')} style={styles.paddle} contentFit="contain" />
        </Animated.View>
      </View>
      <Animated.View style={[styles.titleBlock, titleStyle]}>
        <Image source={require('@/assets/images/pongrank-wordmark.png')} style={styles.wordmark} contentFit="contain" />
        <Text style={styles.tagline}>JUEGA. SUBE. COMPITE.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    backgroundColor: Brand.background,
  },
  glow: {
    position: 'absolute',
    width: 460,
    height: 460,
    borderRadius: 230,
    backgroundColor: 'rgba(232, 38, 47, 0.22)',
  },
  flash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Brand.red,
  },
  stage: { width: 260, height: 260, alignItems: 'center', justifyContent: 'center' },
  paddle: { width: 220, height: 220 },
  ring: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: Brand.red,
  },
  titleBlock: { alignItems: 'center', gap: Spacing.two, width: '100%' },
  wordmark: { width: '80%', height: 52 },
  tagline: { color: Brand.textSecondary, letterSpacing: 3, fontSize: 12 },
});
