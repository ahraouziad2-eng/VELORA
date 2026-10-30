import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { spacing } from '@/constants/theme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  icon: { marginBottom: spacing.md },
  title: { fontSize: 18, fontWeight: '700', color: Colors.neutral.text, textAlign: 'center', fontFamily: 'System' },
  description: { fontSize: 14, color: Colors.neutral.textMuted, textAlign: 'center', marginTop: spacing.sm, fontFamily: 'System' },
  action: { marginTop: spacing.lg },
});
