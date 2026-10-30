import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { FileText, Clock } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';

interface DocRow {
  id: string;
  doc_type: string;
  doc_name: string;
  doc_url: string;
  verification_status: string;
  created_at: string;
  lands: { name: string } | null;
}

export default function DocumentsScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('land_documents')
        .select(`
          id, doc_type, doc_name, doc_url, verification_status, created_at,
          lands(name)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDocs(data as unknown as DocRow[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
      PENDING: { label: t('docStatus.pending'), variant: 'warning' },
      VERIFIED: { label: t('docStatus.verified'), variant: 'success' },
      REJECTED: { label: t('docStatus.rejected'), variant: 'error' },
      NEEDS_REVISION: { label: t('docStatus.needsRevision'), variant: 'info' },
    };
    return map[status] || { label: status, variant: 'neutral' };
  };

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('documents.title')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={docs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.main]} />}
        ListEmptyComponent={<EmptyState icon={<FileText size={48} color={Colors.neutral.border} />} title={t('documents.empty')} />}
        renderItem={({ item }) => {
          const badge = getStatusBadge(item.verification_status);
          return (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.docIcon}><FileText size={18} color={Colors.warning.main} /></View>
                <View style={styles.docInfo}>
                  <Text style={styles.docName} numberOfLines={1}>{item.doc_name}</Text>
                  <Text style={styles.docLand}>{item.lands?.name || '---'}</Text>
                </View>
                <Badge label={badge.label} variant={badge.variant} />
              </View>
              <View style={styles.cardFooter}>
                <Clock size={12} color={Colors.neutral.light} />
                <Text style={styles.docDate}>{new Date(item.created_at).toLocaleDateString('ar-DZ')}</Text>
              </View>
            </Card>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.neutral.white, borderBottomWidth: 1, borderBottomColor: Colors.neutral.borderLight },
  backBtn: { padding: 4 },
  backText: { fontSize: 16, color: Colors.primary.main, fontWeight: '600', fontFamily: 'System' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.neutral.text, fontFamily: 'System' },
  list: { padding: 16, gap: 12 },
  card: { gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  docIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.warning.bg, alignItems: 'center', justifyContent: 'center' },
  docInfo: { flex: 1 },
  docName: { fontSize: 15, fontWeight: '600', color: Colors.neutral.text, fontFamily: 'System' },
  docLand: { fontSize: 13, color: Colors.neutral.textMuted, marginTop: 2, fontFamily: 'System' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  docDate: { fontSize: 12, color: Colors.neutral.light, fontFamily: 'System' },
});
