import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Mail, Phone, MapPin, Send } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { SocialLinksBar } from '@/components/SocialLinksBar';

export default function ContactScreen() {
  const { profile, user } = useAuth();
  const { t, locale } = useI18n();
  const { show } = useToast();
  const [name, setName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadContactInfo = useCallback(async () => {
    try {
      const { data } = await supabase.from('site_content').select('key, value').in('key', [
        'contact_email', 'contact_phone', `contact_address_${locale}`,
      ]);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((row: any) => { map[row.key] = row.value; });
        setContactEmail(map['contact_email'] || '');
        setContactPhone(map['contact_phone'] || '');
        setContactAddress(map[`contact_address_${locale}`] || '');
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locale]);

  useEffect(() => { loadContactInfo(); }, [loadContactInfo]);

  const onRefresh = useCallback(() => { setRefreshing(true); loadContactInfo(); }, [loadContactInfo]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      show(t('auth.fillAllFields'), 'error');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      show(t('auth.invalidEmail'), 'error');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        status: 'NEW',
        user_id: user?.id || null,
      });
      if (error) throw error;
      show(t('contact.success'), 'success');
      setSubject(''); setMessage('');
      if (!profile) { setName(''); setEmail(''); }
    } catch {
      show(t('contact.error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.main]} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('contact.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {(contactEmail || contactPhone || contactAddress) && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>{t('contact.info')}</Text>
            {contactEmail && (
              <View style={styles.contactRow}>
                <Mail size={16} color={Colors.primary.main} />
                <Text style={styles.contactText}>{contactEmail}</Text>
              </View>
            )}
            {contactPhone && (
              <View style={styles.contactRow}>
                <Phone size={16} color={Colors.primary.main} />
                <Text style={styles.contactText}>{contactPhone}</Text>
              </View>
            )}
            {contactAddress && (
              <View style={styles.contactRow}>
                <MapPin size={16} color={Colors.primary.main} />
                <Text style={styles.contactText}>{contactAddress}</Text>
              </View>
            )}
          </Card>
        )}

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>{t('contact.title')}</Text>
          <TextInput style={styles.input} placeholder={t('contact.name')} placeholderTextColor={Colors.neutral.light} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder={t('contact.email')} placeholderTextColor={Colors.neutral.light} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder={t('contact.subject')} placeholderTextColor={Colors.neutral.light} value={subject} onChangeText={setSubject} />
          <TextInput style={[styles.input, styles.textArea]} placeholder={t('contact.message')} placeholderTextColor={Colors.neutral.light} value={message} onChangeText={setMessage} multiline numberOfLines={5} textAlignVertical="top" />
          <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
            <Send size={18} color={Colors.neutral.white} />
            <Text style={styles.submitBtnText}>{submitting ? t('common.loading') : t('contact.submit')}</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>{t('social.title')}</Text>
          <SocialLinksBar />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.primary.dark },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.neutral.white, fontFamily: 'System' },
  content: { padding: 16, gap: 16 },
  card: { gap: 10 },
  formCard: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutral.text, fontFamily: 'System' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  contactText: { fontSize: 14, color: Colors.neutral.textLight, fontFamily: 'System' },
  input: { backgroundColor: Colors.neutral.surface, borderWidth: 1.5, borderColor: Colors.neutral.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.neutral.text, fontFamily: 'System' },
  textArea: { minHeight: 100, textAlignVertical: 'top' as any },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary.main, paddingVertical: 14, borderRadius: radius.md, marginTop: 4 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: Colors.neutral.white, fontSize: 16, fontWeight: '700', fontFamily: 'System' },
  socialSection: { alignItems: 'center', gap: 12, marginTop: 8 },
  socialTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutral.text, fontFamily: 'System' },
});
