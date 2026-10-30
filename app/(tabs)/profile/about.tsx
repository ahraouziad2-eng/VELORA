import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Info, Shield, Scale, Mail, Phone, MapPin } from 'lucide-react-native';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { BrandLogo } from '@/components/BrandLogo';
import { LoadingState } from '@/components/ui/LoadingState';
import { SocialLinksBar } from '@/components/SocialLinksBar';

export default function AboutScreen() {
  const { t, locale } = useI18n();
  const [aboutText, setAboutText] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await supabase.from('site_content').select('key, value').in('key', [
        `about_${locale}`,
        'contact_email',
        'contact_phone',
        `contact_address_${locale}`,
      ]);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((row: any) => { map[row.key] = row.value; });
        setAboutText(map[`about_${locale}`] || map['about_ar'] || t('about.description'));
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
  }, [locale, t]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

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
        <Text style={styles.headerTitle}>{t('aboutPage.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <BrandLogo variant="stacked" size={200} />
        </View>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Info size={20} color={Colors.primary.main} />
            <Text style={styles.cardTitle}>VELORA</Text>
          </View>
          <Text style={styles.cardText}>{aboutText}</Text>
        </Card>

        {(contactEmail || contactPhone || contactAddress) && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Mail size={20} color={Colors.accent.main} />
              <Text style={styles.cardTitle}>{t('contact.info')}</Text>
            </View>
            {contactEmail && (
              <View style={styles.contactRow}>
                <Mail size={16} color={Colors.neutral.textMuted} />
                <Text style={styles.contactText}>{contactEmail}</Text>
              </View>
            )}
            {contactPhone && (
              <View style={styles.contactRow}>
                <Phone size={16} color={Colors.neutral.textMuted} />
                <Text style={styles.contactText}>{contactPhone}</Text>
              </View>
            )}
            {contactAddress && (
              <View style={styles.contactRow}>
                <MapPin size={16} color={Colors.neutral.textMuted} />
                <Text style={styles.contactText}>{contactAddress}</Text>
              </View>
            )}
          </Card>
        )}

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Scale size={20} color={Colors.warning.main} />
            <Text style={styles.cardTitle}>{t('terms.title')}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/terms')}>
            <Text style={styles.linkText}>{t('terms.title')} →</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Shield size={20} color={Colors.accent.main} />
            <Text style={styles.cardTitle}>{t('privacy.title')}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/privacy')}>
            <Text style={styles.linkText}>{t('privacy.title')} →</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Mail size={20} color={Colors.primary.main} />
            <Text style={styles.cardTitle}>{t('contact.title')}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/contact')}>
            <Text style={styles.linkText}>{t('contact.title')} →</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>{t('social.title')}</Text>
          <SocialLinksBar />
        </View>

        <Text style={styles.version}>{t('about.version')} 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.primary.dark },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.neutral.white, fontFamily: 'System' },
  content: { padding: 16, gap: 16, alignItems: 'center' },
  logoWrap: { marginBottom: 8 },
  card: { width: '100%', gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutral.text, flex: 1, fontFamily: 'System' },
  cardText: { fontSize: 14, color: Colors.neutral.textLight, lineHeight: 22, fontFamily: 'System' },
  linkText: { fontSize: 14, color: Colors.primary.main, fontWeight: '600', fontFamily: 'System' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  contactText: { fontSize: 14, color: Colors.neutral.textLight, fontFamily: 'System' },
  socialSection: { width: '100%', alignItems: 'center', gap: 12, marginTop: 8 },
  socialTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutral.text, fontFamily: 'System' },
  version: { fontSize: 13, color: Colors.neutral.light, marginTop: 8, fontFamily: 'System' },
});
