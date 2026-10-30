import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Plus, MapPin, BadgeCheck, MapPinned, Trash2, FileText } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { SafeImage } from '@/components/SafeImage';
import { FALLBACK_IMAGE } from '@/src/data/demoImages';

interface MyLand {
  id: string;
  name: string;
  wilaya: string;
  commune: string;
  area: number;
  land_type: string;
  offer_type: string;
  verification_status: string;
  is_published: boolean;
  land_images: { image_url: string; is_primary: boolean }[];
}

export default function MyLandsScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { show } = useToast();
  const [lands, setLands] = useState<MyLand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLands = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('lands')
        .select(`
          id, name, wilaya, commune, area, land_type, offer_type, verification_status, is_published,
          land_images(image_url, is_primary)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLands(data as unknown as MyLand[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadLands();
  }, [loadLands]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLands();
  }, [loadLands]);

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`${name} - ${t('common.delete')}؟`);
    if (!confirmed) return;
    const { error } = await supabase.from('lands').delete().eq('id', id);
    if (error) {
      show(t('common.error'), 'error');
    } else {
      show(t('common.success'), 'success');
      loadLands();
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
      VERIFIED: { label: t('land.verified'), variant: 'success' },
      PENDING_REVIEW: { label: t('land.pendingReview'), variant: 'warning' },
      REJECTED: { label: t('land.rejected'), variant: 'error' },
      NEEDS_INFO: { label: t('land.needsInfo'), variant: 'info' },
      UNVERIFIED: { label: t('land.unverified'), variant: 'neutral' },
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
        <Text style={styles.headerTitle}>{t('profile.myLands')}</Text>
        <View style={{ width: 60 }} />
      </View>

      {lands.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState icon={<MapPinned size={48} color={Colors.neutral.border} />} title={t('common.noData')} />
          <Button title={t('home.addLand')} onPress={() => router.push('/add-land')} size="md" />
        </View>
      ) : (
        <FlatList
          data={lands}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.main]} />}
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.verification_status);
            const img = item.land_images?.find((i) => i.is_primary)?.image_url || item.land_images?.[0]?.image_url;
            return (
              <Card style={styles.card}>
                <TouchableOpacity onPress={() => router.push(`/land/${item.id}`)} activeOpacity={0.85}>
                  <View style={styles.cardTop}>
                    <SafeImage uri={img ?? null} fallback={FALLBACK_IMAGE.lands} style={styles.cardImage} />
                    <View style={styles.cardInfo}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                        {item.verification_status === 'VERIFIED' && <BadgeCheck size={18} color={Colors.primary.main} />}
                      </View>
                      <View style={styles.cardMeta}>
                        <MapPin size={13} color={Colors.neutral.textMuted} />
                        <Text style={styles.cardMetaText}>{item.wilaya} - {item.commune}</Text>
                      </View>
                      <View style={styles.cardBadges}>
                        <Badge label={badge.label} variant={badge.variant} />
                        <Text style={styles.cardArea}>{item.area} {t('land.hectare')}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}>
                    <Trash2 size={16} color={Colors.error.main} />
                    <Text style={styles.deleteText}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity onPress={() => router.push('/add-land')} style={styles.fab}>
        <Plus size={28} color={Colors.neutral.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.neutral.white, borderBottomWidth: 1, borderBottomColor: Colors.neutral.borderLight },
  backBtn: { padding: 4 },
  backText: { fontSize: 16, color: Colors.primary.main, fontWeight: '600', fontFamily: 'System' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.neutral.text, fontFamily: 'System' },
  emptyWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  list: { padding: 16, gap: 12, paddingBottom: 80 },
  card: { padding: 12, gap: 10 },
  cardTop: { flexDirection: 'row', gap: 12 },
  cardImage: { width: 80, height: 80, borderRadius: 12 },
  cardInfo: { flex: 1, gap: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardName: { fontSize: 16, fontWeight: '700', color: Colors.neutral.text, flex: 1, fontFamily: 'System' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 13, color: Colors.neutral.textMuted, fontFamily: 'System' },
  cardBadges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardArea: { fontSize: 13, fontWeight: '600', color: Colors.primary.main, fontFamily: 'System' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: Colors.neutral.borderLight, paddingTop: 8 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deleteText: { fontSize: 13, color: Colors.error.main, fontWeight: '600', fontFamily: 'System' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary.main, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary.main, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});
