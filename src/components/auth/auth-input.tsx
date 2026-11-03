import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';

type AuthInputProps = TextInputProps & { icon?: LucideIcon };

export function AuthInput({ icon: Icon, style, ...props }: AuthInputProps) {
  return (
    <View>
      {Icon && (
        <View style={styles.icon} pointerEvents="none">
          <Icon color={Brand.textSecondary} size={20} />
        </View>
      )}
      <TextInput
        placeholderTextColor={Brand.textSecondary}
        style={[styles.input, Icon && styles.inputWithIcon, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    color: Brand.text,
    fontSize: 16,
    backgroundColor: Brand.surface,
  },
  inputWithIcon: { paddingLeft: 48 },
  icon: { position: 'absolute', left: Spacing.three, top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 },
});
