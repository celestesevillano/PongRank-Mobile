import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';

type AuthButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  icon?: LucideIcon;
  hideChevron?: boolean;
  foregroundColor?: string;
  // 'ghost' se conserva como alias de 'secondary'
  variant?: 'primary' | 'secondary' | 'text' | 'ghost';
};

export function AuthButton({ label, loading, icon: Icon, hideChevron, foregroundColor = Brand.text, variant = 'primary', disabled, style, ...rest }: AuthButtonProps) {
  const isPrimary = variant === 'primary';
  const isText = variant === 'text';
  const off = disabled || loading;
  const labelColor = off && !loading ? Brand.textDisabled : isText ? Brand.cyan : foregroundColor;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : isText ? styles.text : styles.secondary,
        off && !loading && styles.disabled,
        pressed && !off && (isPrimary ? styles.primaryPressed : styles.pressed),
        style as object,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : Brand.cyan} />
      ) : (
        <>
          {Icon && <Icon size={18} color={labelColor} />}
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
          {isPrimary && !Icon && !hideChevron && <Text style={[styles.label, { color: labelColor }]}>{'  >'}</Text>}
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
    backgroundColor: Brand.primary,
  },
  primaryPressed: {
    backgroundColor: Brand.redDark,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Brand.secondaryBorder,
  },
  text: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: Brand.surfaceDisabled,
    borderWidth: 1,
    borderColor: Brand.border,
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
});
