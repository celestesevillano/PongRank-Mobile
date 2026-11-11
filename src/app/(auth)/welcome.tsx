import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { Target, TrendingUp, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { EMBLEM, INTRO_DURATION, SETTLE_AT, WelcomeIntro } from '@/components/welcome-intro';
import { Brand, Spacing } from '@/constants/theme';

let playedIntro = false;

const FEATURES = [
  { Icon: Users, label: 'Compite en tu\ncomunidad' },
  { Icon: TrendingUp, label: 'Mejora tu\nranking' },
  { Icon: Target, label: 'Reta a jugadores\nde tu nivel' },
];

export default function WelcomeScreen() {
  const reduceMotion = useReducedMotion();
  const [playing, setPlaying] = useState(() => !reduceMotion && !playedIntro);
  const time = useSharedValue(playing ? 0 : INTRO_DURATION);

  useEffect(() => {
    if (!playing) return;
    playedIntro = true;
    if (reduceMotion) {
      time.value = INTRO_DURATION;
      setPlaying(false);
      return;
    }
    time.value = withTiming(INTRO_DURATION, { duration: INTRO_DURATION, easing: Easing.linear }, (finished) => {
      if (finished) scheduleOnRN(setPlaying, false);
    });
    return () => cancelAnimation(time);
  }, [playing, reduceMotion, time]);

  const emblem = useAnimatedStyle(() => ({
    opacity: interpolate(time.value, [SETTLE_AT, 1700], [0, 1], Extrapolation.CLAMP),
  }));
  const brand = useAnimatedStyle(() => ({
    opacity: interpolate(time.value, [1585, 1905], [0, 1], Extrapolation.CLAMP),
  }));
  const actions = useAnimatedStyle(() => {
    const progress = interpolate(time.value, [1860, INTRO_DURATION], [0, 1], Extrapolation.CLAMP);
    return { opacity: progress, transform: [{ translateY: (1 - progress) * 6 }] };
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <Animated.View style={emblem}>
            <Image source={EMBLEM} style={styles.paddle} contentFit="contain" />
          </Animated.View>
          {playing && <WelcomeIntro time={time} />}
        </View>

        <Animated.View style={brand}>
          <Image source={require('@/assets/images/pongrank-wordmark.png')} style={styles.wordmark} contentFit="contain" />
          <Text style={styles.tagline}>JUEGA. SUBE. COMPITE.</Text>
        </Animated.View>

        <Animated.View style={actions} pointerEvents={playing ? 'none' : 'auto'}
          accessibilityElementsHidden={playing} importantForAccessibility={playing ? 'no-hide-descendants' : 'auto'}>
          <Text style={styles.title}>Encuentra tu próximo rival</Text>
          <View style={styles.features}>
            {FEATURES.map(({ Icon, label }) => (
              <View key={label} style={styles.featureItem}>
                <Icon color={Brand.red} size={28} strokeWidth={1.8} />
                <Text style={styles.featureLabel}>{label}</Text>
              </View>
            ))}
          </View>
          <AuthButton label="Empezar" disabled={playing} onPress={() => router.push('/(auth)/register')} />
          {playing ? <Text style={styles.loginLink}>Ya tengo cuenta</Text> : (
            <Link href="/(auth)/login" style={styles.loginLink}>Ya tengo cuenta</Link>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.background,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paddle: {
    width: 220,
    height: 220,
  },
  wordmark: {
    width: '100%',
    height: 56,
    alignSelf: 'center',
  },
  tagline: {
    color: Brand.textSecondary,
    textAlign: 'center',
    letterSpacing: 2,
    fontSize: 12,
    marginTop: Spacing.two,
  },
  title: {
    color: Brand.text,
    fontSize: 28,
    fontWeight: '700',
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  featureLabel: {
    color: Brand.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  loginLink: {
    color: Brand.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
});
