import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { FileSignature, Calendar, FileText } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';

interface ContractRow {
  id: string;
  contract_number: string;
  contract_type: string;
  start_date: string;
  end_date: string | null;
  status: string;
  terms: string | null;
  lands: { name: string } | null;
}

export default function ContractsScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id, contract_number, contract_type, start_date, end_date, status, terms,
          lands(name)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setContracts(data as unknown as ContractRow[]);
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
      DRAFT: { label: t('contractStatus.draft'), variant: 'neutral' },
      ACTIVE: { label: t('contractStatus.active'), variant: 'success' },
      EXPIRED: { label: t('contractStatus.expired'), variant: 'warning' },
      TERMINATED: { label: t('contractStatus.terminated'), variant: 'error' },
      PENDING_SIGNATURE: { label: t('contractStatus.pendingSignature'), variant: 'info' },
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
        <Text style={styles.headerTitle}>{t('contracts.title')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={contracts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.main]} />}
        ListEmptyComponent={<EmptyState icon={<FileSignature size={48} color={Colors.neutral.border} />} title={t('contracts.empty')} />}
        renderItem={({ item }) => {
          const badge = getStatusBadge(item.status);
          return (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}><FileText size={18} color={Colors.accent.main} /></View>
                <Text style={styles.contractNum}>{item.contract_number}</Text>
                <Badge label={badge.label} variant={badge.variant} />
              </View>
              <Text style={styles.contractLand}>{item.lands?.name || '---'}</Text>
              <View style={styles.datesRow}>
                <View style={styles.dateItem}>
                  <Calendar size={14} color={Colors.neutral.light} />
                  <Text style={styles.dateText}>{item.start_date}</Text>
                </View>
                {item.end_date && (
                  <View style={styles.dateItem}>
                    <Calendar size={14} color={Colors.neutral.light} />
                    <Text style={styles.dateText}>{item.end_date}</Text>
                  </View>
                )}
              </View>
              {item.terms && <Text style={styles.terms} numberOfLines={2}>{item.terms}</Text>}
            </Card>
          );
        }}
        showsVerticalScrollIndicator={false}
      />

      <Text style={styles.disclaimer}>{t('contracts.disclaimer')}</Text>
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.accent.bg, alignItems: 'center', justifyContent: 'center' },
  contractNum: { fontSize: 15, fontWeight: '700', color: Colors.neutral.text, flex: 1, fontFamily: 'System' },
  contractLand: { fontSize: 14, color: Colors.neutral.textMuted, fontFamily: 'System' },
  datesRow: { flexDirection: 'row', gap: 16 },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 13, color: Colors.neutral.textLight, fontFamily: 'System' },
  terms: { fontSize: 13, color: Colors.neutral.textMuted, fontFamily: 'System' },
  disclaimer: { fontSize: 11, color: Colors.neutral.textMuted, textAlign: 'center', paddingHorizontal: 24, paddingVertical: 16, lineHeight: 18, fontFamily: 'System' },
});
