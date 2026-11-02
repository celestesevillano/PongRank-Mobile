import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { Brand, Spacing } from '@/constants/theme';
import { useToast } from '@/context/toast';
import { authService } from '@/services/auth.service';
import { toApiError } from '@/utils/api-error';
import { validateEmail } from '@/utils/validation';

export default function ForgotPasswordScreen() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      showToast('Si el correo existe, te enviamos un enlace para restablecer tu contraseña.');
      router.back();
    } catch (err) {
      showToast(toApiError(err).message, 'error');
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
        <Text style={styles.title}>Recupera tu contraseña</Text>
        <Text style={styles.subtitle}>Te enviaremos un enlace a tu correo.</Text>
        <AuthInput placeholder="Correo" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <AuthButton label="Enviar enlace" disabled={validateEmail(email) !== null} loading={loading} onPress={submit} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, gap: Spacing.three },
  back: { color: Brand.text, fontSize: 28 },
  title: { color: Brand.text, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: Spacing.four },
  subtitle: { color: Brand.textSecondary, textAlign: 'center' },
});
