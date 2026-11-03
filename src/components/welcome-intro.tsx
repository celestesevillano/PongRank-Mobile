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

const SWING_MS = 550;
const TOTAL_MS = 2000;

let alreadyPlayed = false;

export function WelcomeIntro() {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(!alreadyPlayed);

  const swing = useSharedValue(0);
  const ball = useSharedValue(0);
  const shock = useSharedValue(0);
  const title = useSharedValue(0);
  const overlay = useSharedValue(1);

  useEffect(() => {
    if (!visible) return;
    alreadyPlayed = true;
    const finish = () => setVisible(false);

    if (reduceMotion) {
      title.value = 1;
      overlay.value = withDelay(800, withTiming(0, { duration: 200 }, (done) => done && runOnJS(finish)()));
      return;
    }

    swing.value = withTiming(1, { duration: SWING_MS, easing: Easing.out(Easing.cubic) });
    ball.value = withDelay(SWING_MS, withTiming(1, { duration: 500, easing: Easing.in(Easing.quad) }));
    shock.value = withDelay(SWING_MS, withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }));
    title.value = withDelay(800, withTiming(1, { duration: 500 }));
    overlay.value = withDelay(
      TOTAL_MS - 300,
      withTiming(0, { duration: 300 }, (done) => done && runOnJS(finish)()),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const paddleStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateY: '-30deg' },
      { rotateZ: `${-45 + swing.value * 40}deg` },
      { translateX: swing.value * 36 },
    ],
  }));

  const ballStyle = useAnimatedStyle(() => ({
    opacity: 1 - ball.value,
    transform: [{ translateX: ball.value * 150 }, { translateY: -ball.value * 70 }, { scale: 1 - ball.value * 0.6 }],
  }));

  const shockStyle = useAnimatedStyle(() => ({
    opacity: shock.value === 0 ? 0 : 1 - shock.value,
    transform: [{ scale: 0.3 + shock.value * 3.5 }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: title.value,
    transform: [{ translateY: (1 - title.value) * 12 }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="auto">
      <View style={styles.glow} />
      <View style={styles.stage}>
        <Animated.View style={[styles.shock, shockStyle]} />
        <Animated.View style={[styles.ball, ballStyle]} />
        <Animated.View style={paddleStyle}>
          <Image source={require('@/assets/images/pongrank-paddle.png')} style={styles.paddle} contentFit="contain" />
        </Animated.View>
      </View>
      <Animated.View style={[styles.titleBlock, titleStyle]}>
        <Image source={require('@/assets/images/pongrank-wordmark.png')} style={styles.wordmark} contentFit="contain" />
        <Text style={styles.tagline}>Juega. Sube. Compite.</Text>
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
    gap: Spacing.three,
    backgroundColor: Brand.background,
  },
  glow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(232, 38, 47, 0.14)',
  },
  stage: { width: 220, height: 160, alignItems: 'center', justifyContent: 'center' },
  paddle: { width: 120, height: 120 },
  ball: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    right: 40,
    top: 60,
  },
  shock: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: Brand.red,
  },
  titleBlock: { alignItems: 'center', gap: Spacing.two },
  wordmark: { width: 200, height: 40 },
  tagline: { color: Brand.textSecondary, letterSpacing: 1 },
});
