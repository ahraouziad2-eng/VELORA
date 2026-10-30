import { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Phone, MessageCircle, Eye, EyeOff } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import { formatLocalPhone, maskPhone, telUrl, whatsappUrl } from '@/lib/phone';

const CALL_COLOR = '#1B5E45';
const WHATSAPP_COLOR = '#25D366';
const WHATSAPP_TEXT = '#0B3D2E';

interface ContactActionsProps {
  phone: string | null;
  whatsapp: string | null;
  contactName: string | null;
  adTitle: string;
  layout: 'card' | 'bar';
}

export function ContactActions({ phone, whatsapp, contactName, adTitle, layout }: ContactActionsProps) {
  const [revealed, setRevealed] = useState(false);
  const primaryNumber = phone ?? whatsapp;
  const containerStyle = layout === 'bar' ? styles.bar : styles.card;

  if (!primaryNumber) {
    return (
      <View style={containerStyle}>
        <Text style={styles.noContact}>لم يضف المعلن رقم اتصال</Text>
      </View>
    );
  }

  const message = `السلام عليكم، رأيت إعلانك «${adTitle}» على منصة VELORA وأنا مهتم به. هل ما زال متاحاً؟`;
  const openLink = (url: string) => {
    void Linking.openURL(url);
  };

  return (
    <View style={containerStyle}>
      {layout === 'card' ? <Text style={styles.heading}>تواصل مع المعلن</Text> : null}
      {contactName ? <Text style={styles.name}>{contactName}</Text> : null}

      <View style={styles.numberRow}>
        <Text style={styles.number}>{revealed ? formatLocalPhone(primaryNumber) : maskPhone(primaryNumber)}</Text>
        <TouchableOpacity onPress={() => setRevealed((v) => !v)} style={styles.revealBtn} accessibilityRole="button">
          {revealed ? <EyeOff size={16} color={Colors.primary.main} /> : <Eye size={16} color={Colors.primary.main} />}
          <Text style={styles.revealText}>{revealed ? 'إخفاء الرقم' : 'إظهار الرقم'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttons}>
        {phone ? (
          <TouchableOpacity style={[styles.button, { backgroundColor: CALL_COLOR }]} onPress={() => openLink(telUrl(phone))} accessibilityRole="link">
            <Phone size={18} color={Colors.neutral.white} />
            <Text style={[styles.buttonText, { color: Colors.neutral.white }]}>اتصال</Text>
          </TouchableOpacity>
        ) : null}
        {whatsapp ? (
          <TouchableOpacity style={[styles.button, { backgroundColor: WHATSAPP_COLOR }]} onPress={() => openLink(whatsappUrl(whatsapp, message))} accessibilityRole="link">
            <MessageCircle size={18} color={WHATSAPP_TEXT} />
            <Text style={[styles.buttonText, { color: WHATSAPP_TEXT }]}>واتساب</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.neutral.white, borderRadius: radius.lg, borderWidth: 1, borderColor: Colors.neutral.borderLight, padding: 16, gap: 12 },
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.borderLight,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
    gap: 8,
  } as object,
  heading: { fontSize: 16, fontWeight: '700', color: Colors.neutral.text, fontFamily: 'System' },
  name: { fontSize: 14, color: Colors.neutral.textMuted, fontFamily: 'System' },
  noContact: { fontSize: 14, color: Colors.neutral.textMuted, fontFamily: 'System', textAlign: 'center' },
  numberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  number: { fontSize: 16, fontWeight: '700', color: Colors.neutral.text, fontFamily: 'System', writingDirection: 'ltr' } as object,
  revealBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36, paddingHorizontal: 8 },
  revealText: { fontSize: 13, fontWeight: '600', color: Colors.primary.main, fontFamily: 'System' },
  buttons: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, minHeight: 48, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { fontSize: 15, fontWeight: '700', fontFamily: 'System' },
});
