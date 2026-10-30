import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Scale } from 'lucide-react-native';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';

export default function TermsScreen() {
  const { t, locale } = useI18n();
  const [content, setContent] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('content, updated_at')
        .eq('document_type', 'TERMS_AND_STANDARDS')
        .eq('locale', locale)
        .maybeSingle();
      if (!error && data) {
        setContent(data.content);
        setUpdatedAt(data.updated_at);
      } else {
        const fallback = await supabase
          .from('legal_documents')
          .select('content, updated_at')
          .eq('document_type', 'TERMS_AND_STANDARDS')
          .eq('locale', 'ar')
          .maybeSingle();
        if (!fallback.error && fallback.data) {
          setContent(fallback.data.content);
          setUpdatedAt(fallback.data.updated_at);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locale]);

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
        <View style={styles.headerIcon}><Scale size={20} color={Colors.neutral.white} /></View>
        <Text style={styles.headerTitle}>{t('terms.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {updatedAt && (
          <Text style={styles.updatedAt}>{t('terms.lastUpdated')}: {new Date(updatedAt).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale)}</Text>
        )}
        <Card style={styles.card}>
          <Text style={styles.contentText}>{content}</Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.primary.dark },
  backBtn: { padding: 4 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.neutral.white, flex: 1, fontFamily: 'System' },
  content: { padding: 16, gap: 12 },
  updatedAt: { fontSize: 13, color: Colors.neutral.textMuted, fontFamily: 'System' },
  card: { gap: 0 },
  contentText: { fontSize: 14, color: Colors.neutral.textLight, lineHeight: 24, fontFamily: 'System' },
});
