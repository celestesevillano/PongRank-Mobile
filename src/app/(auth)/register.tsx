import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { OnboardingHeader } from '@/components/auth/onboarding-header';
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
    router.push('/(auth)/about-you');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <OnboardingHeader step={1} title="Crea tu cuenta" />

        <View style={styles.form}>
          <View>
            <AuthInput icon={User} placeholder="Nombre completo" autoCapitalize="words" value={name} onChangeText={setName} onBlur={() => markTouched('name')} />
            <FieldError message={touched.name ? nameError : null} />
          </View>
          <View>
            <AuthInput
              icon={Mail}
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
              icon={Lock}
              placeholder="Contraseña"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onBlur={() => markTouched('password')}
            />
            <Pressable style={styles.eyeButton} onPress={() => setShowPassword((s) => !s)}>
              {showPassword ? <EyeOff color={Brand.textSecondary} size={20} /> : <Eye color={Brand.textSecondary} size={20} />}
            </Pressable>
          </View>
          <FieldError message={touched.password ? passwordError : null} />
          <Text style={styles.hint}>Mínimo 8 caracteres, una letra y un número.</Text>
        </View>

        <AuthButton label="Continuar" disabled={!canSubmit} onPress={handleSubmit} />

        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>¿Ya tienes cuenta?</Text>
          <AuthButton label="Iniciar sesión" variant="text" style={styles.loginButton} onPress={() => router.replace('/(auth)/login')} />
        </View>
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
  loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one },
  loginPrompt: { color: Brand.textSecondary },
  loginButton: { paddingHorizontal: Spacing.one },
  loginLink: { color: Brand.cyan, textAlign: 'center', marginTop: Spacing.two, marginBottom: Spacing.three },
});
