import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Brand } from '@/constants/theme';

const PADDLE = require('@/assets/images/pongrank-intro-paddle.png');
const BALL = require('@/assets/images/pongrank-intro-ball.png');
export const EMBLEM = require('@/assets/images/pongrank-paddle.png');
export const INTRO_DURATION = 2190;
export const SETTLE_AT = 1540;
const CONTACT = 1120;

export function WelcomeIntro({ time }: { time: SharedValue<number> }) {
  const paddle = useAnimatedStyle(() => {
    const frames = [250, 600, 945, CONTACT, 1250, SETTLE_AT, 1700];
    const frame = (values: number[]) => interpolate(time.value, frames, values, Extrapolation.CLAMP);
    return {
      opacity: frame([0, 1, 1, 1, 1, 1, 0]),
      transform: [
        { translateX: frame([-3, 0, -16, 6, 11, 0, 0]) },
        { translateY: frame([8, 0, 12, -4, -7, 0, 0]) },
        { rotate: `${frame([-4, 0, -19, 4, 7, 0, 0])}deg` },
        { scale: frame([0.96, 1, 0.99, 1, 1, 1, 1]) },
      ],
    };
  });

  const ball = useAnimatedStyle(() => {
    const frames = [680, 865, CONTACT, 1310, 1465, SETTLE_AT, 1700];
    const frame = (values: number[]) => interpolate(time.value, frames, values, Extrapolation.CLAMP);
    return {
      opacity: frame([0, 1, 1, 1, 1, 1, 0]),
      transform: [
        { translateX: frame([109, 91, 53, 83, 68, 50, 50]) },
        { translateY: frame([-62, -48, -5, -38, -31, -3, -3]) },
        { rotate: `${frame([-48, -36, -6, 32, 19, 0, 0])}deg` },
        { scale: frame([0.9, 0.94, 1, 1, 1, 1, 1]) },
      ],
    };
  });

  const impact = useAnimatedStyle(() => ({
    opacity: interpolate(time.value, [CONTACT - 1, CONTACT, 1400], [0, 0.65, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(time.value, [CONTACT, 1400], [0.6, 2.6], Extrapolation.CLAMP) }],
  }));

  return (
    <View pointerEvents="none" accessible={false} style={styles.stage}>
      <Animated.View style={[styles.paddle, paddle]}>
        <Image source={PADDLE} style={styles.image} contentFit="contain" transition={0} />
      </Animated.View>
      <Animated.View style={[styles.ball, ball]}>
        <Image source={BALL} style={styles.image} contentFit="contain" transition={0} />
      </Animated.View>
      <Animated.View style={[styles.impact, impact]} />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  paddle: { position: 'absolute', width: 220, height: 220 },
  ball: { position: 'absolute', width: 48, height: 48 },
  image: { width: '100%', height: '100%' },
  impact: { position: 'absolute', width: 28, height: 28, marginLeft: 106, marginTop: -10, borderRadius: 14, borderWidth: 2, borderColor: '#22D3EE' },
});
