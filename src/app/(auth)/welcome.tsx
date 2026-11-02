import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { WelcomeIntro } from '@/components/welcome-intro';
import { Brand, Spacing } from '@/constants/theme';

const FEATURES = [
  { icon: '👥', label: 'Compite en tu\ncomunidad' },
  { icon: '📈', label: 'Mejora tu\nranking' },
  { icon: '🎯', label: 'Reta a jugadores\nde tu nivel' },
];

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <Image
            source={require('@/assets/images/pongrank-paddle.png')}
            style={styles.paddle}
            contentFit="contain"
          />
        </View>

        <Image
          source={require('@/assets/images/pongrank-wordmark.png')}
          style={styles.wordmark}
          contentFit="contain"
        />
        <Text style={styles.tagline}>JUEGA. SUBE. COMPITE.</Text>

        <Text style={styles.title}>Encuentra tu próximo rival</Text>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureItem}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        <AuthButton label="Empezar" onPress={() => router.push('/(auth)/register')} />

        <Link href="/(auth)/login" style={styles.loginLink}>
          Ya tengo cuenta
        </Link>
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
  featureIcon: {
    fontSize: 22,
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
