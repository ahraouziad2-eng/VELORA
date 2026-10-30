import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import { ContactDraft, ContactErrors, PHONE_EXAMPLE } from '@/lib/phone';

interface ContactFieldsProps {
  draft: ContactDraft;
  errors: ContactErrors;
  onChange: (patch: Partial<ContactDraft>) => void;
  showSaveOption: boolean;
}

export function ContactFields({ draft, errors, onChange, showSaveOption }: ContactFieldsProps) {
  const setPhone = (phone: string) => onChange({ phone, ...(draft.sameAsPhone ? { whatsapp: phone } : {}) });

  return (
    <View style={styles.section}>
      <Text style={styles.title}>معلومات الاتصال</Text>
      <Text style={styles.hint}>سيظهر هذا الرقم للمهتمين ليتواصلوا معك مباشرة</Text>

      <Text style={styles.label}>رقم الهاتف</Text>
      <View style={[styles.inputRow, errors.phone ? styles.inputRowError : null]}>
        <View style={styles.prefix}>
          <Text style={styles.prefixText}>+213</Text>
        </View>
        <TextInput
          style={styles.input}
          value={draft.phone}
          onChangeText={setPhone}
          placeholder={PHONE_EXAMPLE}
          placeholderTextColor={Colors.neutral.light}
          keyboardType="phone-pad"
          inputMode="tel"
          textAlign="left"
          {...({ dir: 'ltr' } as object)}
        />
      </View>
      {errors.phone ? <Text style={styles.error}>{errors.phone}</Text> : null}

      <Text style={styles.label}>رقم واتساب</Text>
      <TouchableOpacity
        style={styles.checkRow}
        onPress={() => onChange({ sameAsPhone: !draft.sameAsPhone, whatsapp: !draft.sameAsPhone ? draft.phone : draft.whatsapp })}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: draft.sameAsPhone }}
      >
        <View style={[styles.checkbox, draft.sameAsPhone && styles.checkboxOn]}>
          {draft.sameAsPhone ? <Check size={14} color={Colors.neutral.white} /> : null}
        </View>
        <Text style={styles.checkLabel}>نفس رقم الهاتف</Text>
      </TouchableOpacity>
      <View style={[styles.inputRow, errors.whatsapp ? styles.inputRowError : null, draft.sameAsPhone && styles.inputRowDisabled]}>
        <View style={styles.prefix}>
          <Text style={styles.prefixText}>+213</Text>
        </View>
        <TextInput
          style={styles.input}
          value={draft.sameAsPhone ? draft.phone : draft.whatsapp}
          onChangeText={(whatsapp) => onChange({ whatsapp })}
          editable={!draft.sameAsPhone}
          placeholder="0555 12 34 56"
          placeholderTextColor={Colors.neutral.light}
          keyboardType="phone-pad"
          inputMode="tel"
          textAlign="left"
          {...({ dir: 'ltr' } as object)}
        />
      </View>
      {errors.whatsapp ? <Text style={styles.error}>{errors.whatsapp}</Text> : null}
      {errors.general ? <Text style={styles.error}>{errors.general}</Text> : null}

      <Text style={styles.label}>اسم المتصل (اختياري)</Text>
      <TextInput
        style={styles.plainInput}
        value={draft.name}
        onChangeText={(name) => onChange({ name })}
        placeholder="الاسم الذي سيظهر للمهتمين"
        placeholderTextColor={Colors.neutral.light}
      />

      {showSaveOption ? (
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => onChange({ saveToAccount: !draft.saveToAccount })}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: draft.saveToAccount }}
        >
          <View style={[styles.checkbox, draft.saveToAccount && styles.checkboxOn]}>
            {draft.saveToAccount ? <Check size={14} color={Colors.neutral.white} /> : null}
          </View>
          <Text style={styles.checkLabel}>احفظ هذا الرقم في حسابي</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 16, gap: 8 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.neutral.text, fontFamily: 'System' },
  hint: { fontSize: 13, color: Colors.neutral.textMuted, lineHeight: 20, fontFamily: 'System' },
  label: { fontSize: 14, fontWeight: '600', color: Colors.neutral.text, marginTop: 8, fontFamily: 'System' },
  inputRow: { flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderColor: Colors.neutral.border, borderRadius: radius.md, backgroundColor: Colors.neutral.white, overflow: 'hidden' },
  inputRowError: { borderColor: Colors.error.main },
  inputRowDisabled: { opacity: 0.6 },
  prefix: { paddingHorizontal: 12, paddingVertical: 12, backgroundColor: Colors.neutral.bg, borderLeftWidth: 1, borderLeftColor: Colors.neutral.border },
  prefixText: { fontSize: 14, fontWeight: '600', color: Colors.neutral.textMuted, fontFamily: 'System' },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: Colors.neutral.text, fontFamily: 'System', textAlign: 'left' },
  plainInput: { borderWidth: 1, borderColor: Colors.neutral.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: Colors.neutral.text, backgroundColor: Colors.neutral.white, fontFamily: 'System' },
  error: { fontSize: 13, color: Colors.error.main, fontFamily: 'System' },
  checkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.neutral.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.neutral.white },
  checkboxOn: { backgroundColor: Colors.primary.main, borderColor: Colors.primary.main },
  checkLabel: { fontSize: 14, color: Colors.neutral.text, fontFamily: 'System' },
});
