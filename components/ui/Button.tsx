import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { radius, typography } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  fullWidth = false,
}: ButtonProps) {
  const bgColor = {
    primary: Colors.primary.main,
    secondary: Colors.secondary.main,
    outline: 'transparent',
    ghost: 'transparent',
    danger: Colors.error.main,
  }[variant];

  const textColor = {
    primary: Colors.neutral.white,
    secondary: Colors.neutral.white,
    outline: Colors.primary.main,
    ghost: Colors.primary.main,
    danger: Colors.neutral.white,
  }[variant];

  const borderColor = {
    primary: Colors.primary.main,
    secondary: Colors.secondary.main,
    outline: Colors.primary.border,
    ghost: 'transparent',
    danger: Colors.error.main,
  }[variant];

  const paddingVertical = { sm: 8, md: 14, lg: 18 }[size];
  const fontSize = { sm: 14, md: 16, lg: 18 }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: bgColor, borderColor, paddingVertical, paddingHorizontal: size === 'sm' ? 16 : 24 },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: textColor, fontSize }, { fontFamily: 'System', fontWeight: '600' }]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
  } as ViewStyle,
  text: {
    textAlign: 'center',
  } as TextStyle,
  fullWidth: {
    width: '100%',
  } as ViewStyle,
  disabled: {
    opacity: 0.5,
  } as ViewStyle,
});
