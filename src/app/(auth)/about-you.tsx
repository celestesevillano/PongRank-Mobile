import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { FieldError } from '@/components/auth/field-error';
import { SelectField, type SelectOption } from '@/components/auth/select-field';
import { Brand, Spacing } from '@/constants/theme';
import { useRegistration } from '@/context/registration';
import type { Gender } from '@/types/api';
import { ageFromDate, MONTHS, toIsoDate, validateBirthDate } from '@/utils/validation';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Femenino' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefiero no decirlo' },
];

const MIN_AGE = 5;

const parseDraftDate = (iso?: string) => {
  if (!iso) return { day: null, month: null, year: null };
  const [year, month, day] = iso.split('-').map(Number);
  return { day, month, year };
};

export default function AboutYouScreen() {
  const { draft, saveDraft } = useRegistration();
  const initial = parseDraftDate(draft?.birthDate);
  const [day, setDay] = useState<number | null>(initial.day);
  const [month, setMonth] = useState<number | null>(initial.month);
  const [year, setYear] = useState<number | null>(initial.year);
  const [gender, setGender] = useState<Gender | null>(draft?.gender ?? null);
  const [submitted, setSubmitted] = useState(false);

  const dayOptions = useMemo<SelectOption<number>[]>(
    () => Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
    [],
  );
  const monthOptions = useMemo<SelectOption<number>[]>(() => MONTHS.map((label, i) => ({ value: i + 1, label })), []);
  const yearOptions = useMemo<SelectOption<number>[]>(() => {
    const last = new Date().getFullYear() - MIN_AGE;
    return Array.from({ length: last - 1929 }, (_, i) => ({ value: last - i, label: String(last - i) }));
  }, []);

  const dateError = validateBirthDate(day, month, year);
  const age = !dateError && day && month && year ? ageFromDate(day, month, year) : null;
  const canSubmit = !dateError && gender !== null;

  const handleSubmit = () => {
    setSubmitted(true);
    if (!canSubmit || !day || !month || !year || !gender) return;
    saveDraft({ birthDate: toIsoDate(day, month, year), gender });
    router.push('/(auth)/onboarding-rating');
  };

  if (!draft) {
    return <Redirect href="/(auth)/register" />;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{'‹'}</Text>
        </Pressable>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Paso 2 de 4</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { flex: 1 }]} />
            <View style={[styles.progressFill, { flex: 1 }]} />
            <View style={styles.progressFillEmpty} />
            <View style={styles.progressFillEmpty} />
          </View>
        </View>

        <Image source={require('@/assets/images/pongrank-paddle.png')} style={styles.icon} contentFit="contain" />
        <Text style={styles.title}>Cuéntanos sobre ti</Text>
        <Text style={styles.subtitle}>Los usamos para armar rankings y categorías justas. Puedes cambiarlos luego en tu perfil.</Text>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <View>
            <Text style={styles.sectionLabel}>Fecha de nacimiento</Text>
            <View style={styles.dateRow}>
              <SelectField label="Día" value={day} options={dayOptions} onChange={setDay} />
              <View style={styles.monthCell}>
                <SelectField label="Mes" value={month} options={monthOptions} onChange={setMonth} />
              </View>
              <SelectField label="Año" value={year} options={yearOptions} onChange={setYear} />
            </View>
            {age !== null ? (
              <View style={styles.ageRow}>
                <CalendarDays color={Brand.textSecondary} size={16} />
                <Text style={styles.ageText}>Tienes {age} años</Text>
              </View>
            ) : (
              <FieldError message={submitted ? dateError : null} />
            )}
          </View>

          <View>
            <Text style={styles.sectionLabel}>
              Sexo <Text style={{ color: Brand.red }}>*</Text> <Text style={styles.required}>· obligatorio</Text>
            </Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.slice(0, 2).map((option) => (
                <GenderButton key={option.value} option={option} selected={gender === option.value} onPress={() => setGender(option.value)} />
              ))}
            </View>
            <View style={styles.genderFull}>
              <GenderButton
                option={GENDER_OPTIONS[2]}
                selected={gender === GENDER_OPTIONS[2].value}
                onPress={() => setGender(GENDER_OPTIONS[2].value)}
              />
            </View>
            <FieldError message={submitted && gender === null ? 'Elige una opción.' : null} />
          </View>
        </ScrollView>

        <AuthButton label="Continuar" disabled={!canSubmit} onPress={handleSubmit} />
        <Text style={styles.privacy}>Tus datos solo se usan para clasificarte. No se muestran a otros jugadores.</Text>
      </SafeAreaView>
    </View>
  );
}

function GenderButton({
  option,
  selected,
  onPress,
}: {
  option: { value: Gender; label: string };
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.genderButton, selected && styles.genderButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.genderLabel, selected && styles.genderLabelActive]}>{option.label}</Text>
    </Pressable>
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
  icon: { width: 48, height: 48, alignSelf: 'center' },
  title: { color: Brand.text, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: Spacing.two },
  subtitle: { color: Brand.textSecondary, textAlign: 'center', fontSize: 13 },
  form: { gap: Spacing.four, paddingTop: Spacing.two },
  sectionLabel: { color: Brand.text, fontSize: 14, fontWeight: '600', marginBottom: Spacing.two },
  required: { color: Brand.textSecondary, fontWeight: '400' },
  dateRow: { flexDirection: 'row', gap: Spacing.two },
  monthCell: { flex: 1.5 },
  ageRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginTop: Spacing.two },
  ageText: { color: Brand.textSecondary, fontSize: 13 },
  genderRow: { flexDirection: 'row', gap: Spacing.two },
  genderFull: { marginTop: Spacing.two },
  genderButton: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Spacing.three,
    backgroundColor: Brand.surface,
  },
  genderButtonActive: { borderColor: Brand.red, backgroundColor: 'rgba(232, 38, 47, 0.15)' },
  genderLabel: { color: Brand.textSecondary, fontSize: 15, fontWeight: '600' },
  genderLabelActive: { color: Brand.text },
  privacy: { color: Brand.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: Spacing.three },
});
