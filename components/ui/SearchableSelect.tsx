import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, TextInput, ViewStyle } from 'react-native';
import { ChevronDown, Check, Search, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';

interface SelectOption {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  searchable?: boolean;
  style?: ViewStyle;
}

export function SearchableSelect({ label, value, options, onSelect, placeholder, error, searchable = true, style }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [options, query]);

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
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => { setOpen(false); setQuery(''); }}>
        <TouchableOpacity style={styles.overlay} onPress={() => { setOpen(false); setQuery(''); }} activeOpacity={1}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label || placeholder || 'اختر'}</Text>
              <TouchableOpacity onPress={() => { setOpen(false); setQuery(''); }} style={styles.closeBtn}>
                <X size={20} color={Colors.neutral.light} />
              </TouchableOpacity>
            </View>
            {searchable && (
              <View style={styles.searchBar}>
                <Search size={16} color={Colors.neutral.light} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="بحث..."
                  placeholderTextColor={Colors.neutral.light}
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                />
                {query ? (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <X size={14} color={Colors.neutral.light} />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.value === value && <Check size={20} color={Colors.primary.main} />}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>لا توجد نتائج</Text>
                </View>
              }
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
  sheet: { backgroundColor: Colors.neutral.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.neutral.border },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.neutral.text, fontFamily: 'System' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.neutral.borderLight },
  searchInput: { flex: 1, fontSize: 15, color: Colors.neutral.text, fontFamily: 'System', paddingVertical: 4 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  optionText: { fontSize: 16, color: Colors.neutral.text, fontFamily: 'System' },
  separator: { height: 1, backgroundColor: Colors.neutral.borderLight },
  emptyWrap: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 15, color: Colors.neutral.textMuted, fontFamily: 'System' },
});
