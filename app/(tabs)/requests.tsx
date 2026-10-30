import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { FileText, TrendingUp, Handshake, Home, Clock } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { PageHero } from '@/components/PageHero';
import { PAGE_HERO_CONFIG } from '@/constants/pageHero';
import { SafeImage } from '@/components/SafeImage';
import { FALLBACK_IMAGE } from '@/src/data/demoImages';

type TabKey = 'investment' | 'rental' | 'partnership';

interface RequestRow {
  id: string;
  land_id: string;
  status: string;
  created_at: string;
  notes: string | null;
  lands: {
    name: string;
    wilaya: string;
    commune: string;
    land_images: { image_url: string; is_primary: boolean }[];
  } | null;
}

export default function RequestsScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('investment');
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    try {
      const tableMap: Record<TabKey, string> = {
        investment: 'land_investment_requests',
        rental: 'rental_requests',
        partnership: 'partnership_requests',
      };
      const { data, error } = await supabase
        .from(tableMap[activeTab])
        .select(`
          id, land_id, status, created_at, notes,
          lands(name, wilaya, commune, land_images(image_url, is_primary))
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setRequests(data as unknown as RequestRow[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, user]);

  useEffect(() => {
    setLoading(true);
    loadRequests();
  }, [loadRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests();
  }, [loadRequests]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
      PENDING: { label: t('status.pending'), variant: 'warning' },
      UNDER_REVIEW: { label: t('status.underReview'), variant: 'info' },
      ACCEPTED: { label: t('status.accepted'), variant: 'success' },
      REJECTED: { label: t('status.rejected'), variant: 'error' },
      CANCELLED: { label: t('status.cancelled'), variant: 'neutral' },
      COMPLETED: { label: t('status.completed'), variant: 'success' },
    };
    return map[status] || { label: status, variant: 'neutral' };
  };

  const tabs = [
    { key: 'investment' as TabKey, label: t('requests.investment'), icon: <TrendingUp size={18} color={Colors.primary.main} /> },
    { key: 'rental' as TabKey, label: t('requests.rental'), icon: <Home size={18} color={Colors.primary.main} /> },
    { key: 'partnership' as TabKey, label: t('requests.partnership'), icon: <Handshake size={18} color={Colors.primary.main} /> },
  ];

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <PageHero title={t('requests.title')} subtitle="تابع طلباتك واستثماراتك الفلاحية" config={PAGE_HERO_CONFIG.requests} />

      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            {tab.icon}
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const badge = getStatusBadge(item.status);
          return (
            <TouchableOpacity onPress={() => router.push(`/land/${item.land_id}`)}>
              <Card style={styles.card}>
                <SafeImage
                  uri={item.lands?.land_images?.find((img) => img.is_primary)?.image_url ?? item.lands?.land_images?.[0]?.image_url ?? null}
                  fallback={FALLBACK_IMAGE.lands}
                  style={styles.thumb}
                />
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLandName} numberOfLines={1}>
                    {item.lands?.name || '---'}
                  </Text>
                  <Badge label={badge.label} variant={badge.variant} />
                </View>
                <Text style={styles.cardLocation}>
                  {item.lands?.wilaya} - {item.lands?.commune}
                </Text>
                <View style={styles.cardFooter}>
                  <Clock size={14} color={Colors.neutral.light} />
                  <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString('ar-DZ')}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.main]} />}
        ListEmptyComponent={<EmptyState icon={<FileText size={48} color={Colors.neutral.border} />} title={t('requests.empty')} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { padding: 16, backgroundColor: Colors.neutral.white, borderBottomWidth: 1, borderBottomColor: Colors.neutral.borderLight },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.neutral.text, fontFamily: 'System' },
  tabs: { flexDirection: 'row', backgroundColor: Colors.neutral.white, paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.md, backgroundColor: Colors.neutral.surface },
  tabActive: { backgroundColor: Colors.primary.bg, borderWidth: 1, borderColor: Colors.primary.border },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.neutral.textMuted, fontFamily: 'System' },
  tabTextActive: { color: Colors.primary.main },
  list: { padding: 16, gap: 12 },
  card: { gap: 8 },
  thumb: { width: '100%', height: 140, borderRadius: radius.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLandName: { fontSize: 16, fontWeight: '700', color: Colors.neutral.text, flex: 1, fontFamily: 'System' },
  cardLocation: { fontSize: 14, color: Colors.neutral.textMuted, fontFamily: 'System' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDate: { fontSize: 13, color: Colors.neutral.light, fontFamily: 'System' },
});
