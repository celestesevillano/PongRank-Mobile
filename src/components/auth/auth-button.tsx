import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';

type AuthButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  icon?: LucideIcon;
  hideChevron?: boolean;
  foregroundColor?: string;
  variant?: 'primary' | 'ghost';
};

export function AuthButton({ label, loading, icon: Icon, hideChevron, foregroundColor = Brand.text, variant = 'primary', disabled, style, ...rest }: AuthButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style as object,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : Brand.red} />
      ) : (
        <>
          {Icon && <Icon size={18} color={foregroundColor} />}
          <Text style={[styles.label, { color: foregroundColor }]}>{label}</Text>
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
    backgroundColor: Brand.red,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
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
