import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { Brand, Spacing } from '@/constants/theme';
import { useRegistration } from '@/context/registration';
import { FieldError } from '@/components/auth/field-error';
import { validateEmail, validateName, validatePassword } from '@/utils/validation';

export default function RegisterScreen() {
  const { draft, saveDraft } = useRegistration();
  const [name, setName] = useState(draft?.name ?? '');
  const [email, setEmail] = useState(draft?.email ?? '');
  const [password, setPassword] = useState(draft?.password ?? '');
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  const nameError = validateName(name);
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const canSubmit = !nameError && !emailError && !passwordError;
  const markTouched = (field: keyof typeof touched) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = () => {
    saveDraft({ name: name.trim(), email: email.trim(), password });
    router.push('/(auth)/onboarding-rating');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{'‹'}</Text>
        </Pressable>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Paso 1 de 3</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { flex: 1 }]} />
            <View style={styles.progressFillEmpty} />
            <View style={styles.progressFillEmpty} />
          </View>
        </View>

        <Image source={require('@/assets/images/pongrank-paddle.png')} style={styles.icon} contentFit="contain" />
        <Image source={require('@/assets/images/pongrank-wordmark.png')} style={styles.wordmark} contentFit="contain" />

        <Text style={styles.title}>Crea tu cuenta</Text>

        <View style={styles.form}>
          <View>
            <AuthInput placeholder="Nombre completo" autoCapitalize="words" value={name} onChangeText={setName} onBlur={() => markTouched('name')} />
            <FieldError message={touched.name ? nameError : null} />
          </View>
          <View>
            <AuthInput
              placeholder="Correo"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onBlur={() => markTouched('email')}
            />
            <FieldError message={touched.email ? emailError : null} />
          </View>
          <View>
            <AuthInput
              placeholder="Contraseña"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onBlur={() => markTouched('password')}
            />
            <Pressable style={styles.eyeButton} onPress={() => setShowPassword((s) => !s)}>
              <Text style={{ color: Brand.textSecondary }}>{showPassword ? '🙈' : '👁'}</Text>
            </Pressable>
          </View>
          <FieldError message={touched.password ? passwordError : null} />
          <Text style={styles.hint}>Mínimo 8 caracteres, una letra y un número.</Text>
        </View>

        <AuthButton label="Continuar" disabled={!canSubmit} onPress={handleSubmit} />

        <Pressable onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.loginLink}>Ya tengo cuenta</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, gap: Spacing.three },
  back: { color: Brand.text, fontSize: 28 },
  progressRow: { gap: Spacing.one, marginBottom: Spacing.two },
  progressLabel: { color: Brand.textSecondary, fontSize: 12, textAlign: 'center' },
  progressTrack: { flexDirection: 'row', gap: 4 },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: Brand.red },
  progressFillEmpty: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Brand.border },
  icon: { width: 56, height: 56, alignSelf: 'center' },
  wordmark: { width: 160, height: 32, alignSelf: 'center' },
  title: { color: Brand.text, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: Spacing.two },
  form: { gap: Spacing.three, marginTop: Spacing.two },
  eyeButton: { position: 'absolute', right: Spacing.three, top: 0, bottom: 0, justifyContent: 'center' },
  hint: { color: Brand.textSecondary, fontSize: 12 },
  error: { color: Brand.red, fontSize: 13 },
  loginLink: { color: Brand.textSecondary, textAlign: 'center', marginTop: Spacing.two, marginBottom: Spacing.three },
});
