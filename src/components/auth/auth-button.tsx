import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';

type AuthButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  icon?: LucideIcon;
  hideChevron?: boolean;
  foregroundColor?: string;
  // primary: rojo sólido, una por pantalla. secondary: contorno claro. ghost: solo texto.
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function AuthButton({ label, loading, icon: Icon, hideChevron, foregroundColor = Brand.text, variant = 'primary', disabled, style, ...rest }: AuthButtonProps) {
  const isPrimary = variant === 'primary';
  const isDisabled = Boolean(disabled) && !loading;
  const labelColor = isDisabled ? Brand.disabledText : foregroundColor;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: Boolean(loading) }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : variant === 'secondary' ? styles.secondary : styles.ghost,
        isDisabled && styles.disabled,
        loading && styles.loading,
        pressed && styles.pressed,
        style as object,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : Brand.red} />
      ) : (
        <>
          {Icon && <Icon size={18} color={labelColor} />}
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
          {isPrimary && !Icon && !hideChevron && <Text style={[styles.label, styles.labelPrimary]}>{'  >'}</Text>}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 44,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  primary: {
    backgroundColor: Brand.action,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Brand.borderStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Deshabilitado: relleno plano, sin borde y texto tenue (no se confunde con el secundario)
  disabled: {
    backgroundColor: Brand.disabledSurface,
    borderWidth: 0,
  },
  loading: {
    opacity: 0.85,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  labelPrimary: {
    color: '#FFFFFF',
  },
});
