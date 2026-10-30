import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, ViewStyle } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  style?: ViewStyle;
}

export function Select({ label, value, options, onSelect, placeholder, error, style }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.select, error && styles.selectError]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder || ''}
        </Text>
        <ChevronDown size={20} color={Colors.neutral.light} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label || placeholder || 'اختر'}</Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.value === value && <Check size={20} color={Colors.primary.main} />}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontSize: 14, fontWeight: '500', color: Colors.neutral.text, marginBottom: spacing.sm, fontFamily: 'System' },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral.white,
    borderWidth: 1.5,
    borderColor: Colors.neutral.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  selectError: { borderColor: Colors.error.main },
  selectText: { fontSize: 16, color: Colors.neutral.text, fontFamily: 'System' },
  placeholder: { color: Colors.neutral.light },
  errorText: { color: Colors.error.main, fontSize: 12, marginTop: spacing.xs, fontFamily: 'System' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: Colors.neutral.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  sheetHeader: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.neutral.border },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.neutral.text, fontFamily: 'System' },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  optionText: { fontSize: 16, color: Colors.neutral.text, fontFamily: 'System' },
  separator: { height: 1, backgroundColor: Colors.neutral.borderLight },
});
