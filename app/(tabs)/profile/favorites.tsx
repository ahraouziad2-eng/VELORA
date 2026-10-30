import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Heart, MapPin, BadgeCheck } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { SafeImage } from '@/components/SafeImage';
import { FALLBACK_IMAGE } from '@/src/data/demoImages';

interface FavLand {
  id: string;
  land_id: string;
  lands: {
    id: string;
    name: string;
    wilaya: string;
    commune: string;
    area: number;
    offer_type: string;
    verification_status: string;
    land_images: { image_url: string; is_primary: boolean }[];
  } | null;
}

export default function FavoritesScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [favs, setFavs] = useState<FavLand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavs = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id, land_id,
          lands(id, name, wilaya, commune, area, offer_type, verification_status,
            land_images(image_url, is_primary))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setFavs(data as unknown as FavLand[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadFavs();
  }, [loadFavs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFavs();
  }, [loadFavs]);

  const getOfferLabel = (offer: string) => {
    const map: Record<string, string> = {
      FOR_RENT: t('offerType.forRent'),
      FOR_PARTNERSHIP: t('offerType.forPartnership'),
      FOR_INVESTMENT: t('offerType.forInvestment'),
    };
    return map[offer] || '';
  };

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('favorites.title')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={favs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.main]} />}
        ListEmptyComponent={<EmptyState icon={<Heart size={48} color={Colors.neutral.border} />} title={t('favorites.empty')} />}
        renderItem={({ item }) => {
          const land = item.lands;
          if (!land) return null;
          const img = land.land_images?.find((i) => i.is_primary)?.image_url || land.land_images?.[0]?.image_url;
          return (
            <TouchableOpacity onPress={() => router.push(`/land/${land.id}`)} activeOpacity={0.85}>
              <Card style={styles.card}>
                <View style={styles.cardTop}>
                  <SafeImage uri={img ?? null} fallback={FALLBACK_IMAGE.lands} style={styles.cardImage} />
                  <View style={styles.cardInfo}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardName} numberOfLines={1}>{land.name}</Text>
                      {land.verification_status === 'VERIFIED' && <BadgeCheck size={16} color={Colors.primary.main} />}
                    </View>
                    <View style={styles.cardMeta}>
                      <MapPin size={13} color={Colors.neutral.textMuted} />
                      <Text style={styles.cardMetaText}>{land.wilaya} - {land.commune}</Text>
                    </View>
                    <View style={styles.cardBadges}>
                      <Text style={styles.cardArea}>{land.area} {t('land.hectare')}</Text>
                      {getOfferLabel(land.offer_type) ? <Badge label={getOfferLabel(land.offer_type)} variant="primary" /> : null}
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
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
  card: { padding: 12 },
  cardTop: { flexDirection: 'row', gap: 12 },
  cardImage: { width: 72, height: 72, borderRadius: 12 },
  cardInfo: { flex: 1, gap: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardName: { fontSize: 16, fontWeight: '700', color: Colors.neutral.text, flex: 1, fontFamily: 'System' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 13, color: Colors.neutral.textMuted, fontFamily: 'System' },
  cardBadges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardArea: { fontSize: 13, fontWeight: '600', color: Colors.primary.main, fontFamily: 'System' },
});
