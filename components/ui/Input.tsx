import React from 'react';
import { TextInput, Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  multiline = false,
  numberOfLines = 1,
  style,
  rightIcon,
}: InputProps) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.neutral.light}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  } as ViewStyle,
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.text,
    marginBottom: spacing.sm,
    fontFamily: 'System',
  } as TextStyle,
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  } as ViewStyle,
  inputError: {
    borderColor: Colors.error.main,
  } as ViewStyle,
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.neutral.text,
    fontFamily: 'System',
  } as TextStyle,
  rightIcon: {
    paddingLeft: spacing.sm,
  } as ViewStyle,
  errorText: {
    color: Colors.error.main,
    fontSize: 12,
    marginTop: spacing.xs,
    fontFamily: 'System',
  } as TextStyle,
});
