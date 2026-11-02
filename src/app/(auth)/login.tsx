import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/utils/api-error';
import { validateEmail } from '@/utils/validation';

export default function LoginScreen() {
  const { signInWithAuthResponse } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = validateEmail(email) === null && password.length > 0;

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const auth = await authService.login({ email: email.trim(), password });
      // Un usuario que ya inicia sesión no vuelve a pasar por el onboarding.
      await signInWithAuthResponse(auth, { skipOnboarding: true });
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'Correo o contraseña incorrectos.' : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{'‹'}</Text>
        </Pressable>

        <Image source={require('@/assets/images/pongrank-paddle.png')} style={styles.icon} contentFit="contain" />
        <Image source={require('@/assets/images/pongrank-wordmark.png')} style={styles.wordmark} contentFit="contain" />

        <Text style={styles.title}>Bienvenido de vuelta</Text>

        <View style={styles.form}>
          <AuthInput
            placeholder="Correo"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <View>
            <AuthInput
              placeholder="Contraseña"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable style={styles.eyeButton} onPress={() => setShowPassword((s) => !s)}>
              <Text style={{ color: Brand.textSecondary }}>{showPassword ? '🙈' : '👁'}</Text>
            </Pressable>
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <AuthButton label="Iniciar sesión" disabled={!canSubmit} loading={loading} onPress={handleSubmit} />

        <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
          <Text style={styles.registerLink}>¿Olvidaste tu contraseña?</Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/(auth)/register')}>
          <Text style={styles.registerLink}>¿No tienes cuenta? Crear una</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, gap: Spacing.three },
  back: { color: Brand.text, fontSize: 28 },
  icon: { width: 56, height: 56, alignSelf: 'center', marginTop: Spacing.four },
  wordmark: { width: 160, height: 32, alignSelf: 'center' },
  title: { color: Brand.text, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: Spacing.two },
  form: { gap: Spacing.three, marginTop: Spacing.two },
  eyeButton: { position: 'absolute', right: Spacing.three, top: 0, bottom: 0, justifyContent: 'center' },
  error: { color: Brand.red, fontSize: 13 },
  registerLink: { color: Brand.textSecondary, textAlign: 'center', marginTop: Spacing.two, marginBottom: Spacing.three },
});
