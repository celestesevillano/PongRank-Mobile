import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { Target, TrendingUp, Users } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { INTRO_TOTAL_MS, WelcomeIntro, introWillPlay } from '@/components/welcome-intro';
import { Brand, Spacing } from '@/constants/theme';
import { useEffect, useState } from 'react';

const FEATURES = [
  { Icon: Users, label: 'Compite en tu\ncomunidad' },
  { Icon: TrendingUp, label: 'Mejora tu\nranking' },
  { Icon: Target, label: 'Reta a jugadores\nde tu nivel' },
];

export default function WelcomeScreen() {
  const reduceMotion = useReducedMotion();
  const [startDelay] = useState(() => (introWillPlay() ? INTRO_TOTAL_MS - 300 : 0));
  const float = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    float.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [float, reduceMotion]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -float.value * 10 }, { rotateZ: `${float.value * 2 - 1}deg` }],
  }));

  const enter = (order: number) => (reduceMotion ? undefined : FadeInDown.delay(startDelay + order * 120).duration(500));

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <Animated.View style={floatStyle}>
            <Image
              source={require('@/assets/images/pongrank-paddle.png')}
              style={styles.paddle}
              contentFit="contain"
            />
          </Animated.View>
        </View>

        <Animated.View entering={enter(0)}>
          <Image
            source={require('@/assets/images/pongrank-wordmark.png')}
            style={styles.wordmark}
            contentFit="contain"
          />
          <Text style={styles.tagline}>JUEGA. SUBE. COMPITE.</Text>
        </Animated.View>

        <Animated.Text entering={enter(1)} style={styles.title}>
          Encuentra tu próximo rival
        </Animated.Text>

        <View style={styles.features}>
          {FEATURES.map((f, index) => (
            <Animated.View key={f.label} entering={enter(2 + index)} style={styles.featureItem}>
              <f.Icon color={Brand.red} size={28} strokeWidth={1.8} />
              <Text style={styles.featureLabel}>{f.label}</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={enter(5)}>
          <AuthButton label="Empezar" onPress={() => router.push('/(auth)/register')} />
        </Animated.View>

        <Animated.View entering={enter(6)}>
          <Link href="/(auth)/login" style={styles.loginLink}>
            Ya tengo cuenta
          </Link>
        </Animated.View>
      </SafeAreaView>
      <WelcomeIntro />
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
    marginTop: -Spacing.two,
  },
  title: {
    color: Brand.text,
    fontSize: 28,
    fontWeight: '700',
    marginTop: Spacing.four,
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
