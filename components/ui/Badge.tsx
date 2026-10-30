import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'secondary' | 'accent';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'neutral', size = 'sm' }: BadgeProps) {
  const colors = {
    success: { bg: Colors.success.bg, text: Colors.success.text, border: Colors.success.border },
    warning: { bg: Colors.warning.bg, text: Colors.warning.text, border: Colors.warning.border },
    error: { bg: Colors.error.bg, text: Colors.error.text, border: Colors.error.border },
    info: { bg: Colors.accent.bg, text: Colors.accent.text, border: Colors.accent.border },
    neutral: { bg: Colors.neutral.surface, text: Colors.neutral.textLight, border: Colors.neutral.border },
    primary: { bg: Colors.primary.bg, text: Colors.primary.text, border: Colors.primary.border },
    secondary: { bg: Colors.secondary.bg, text: Colors.secondary.text, border: Colors.secondary.border },
    accent: { bg: Colors.accent.bg, text: Colors.accent.text, border: Colors.accent.border },
  }[variant];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }, size === 'sm' && styles.sm]}>
      <Text style={[styles.text, { color: colors.text }, size === 'sm' && styles.textSm]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  sm: { paddingHorizontal: 8, paddingVertical: 2 },
  text: { fontSize: 12, fontWeight: '600', fontFamily: 'System' },
  textSm: { fontSize: 10 },
});
