import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import { MapPin, BadgeCheck, MapPinned } from 'lucide-react-native';
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

interface MapLand {
  id: string;
  name: string;
  wilaya: string;
  commune: string;
  area: number;
  offer_type: string;
  verification_status: string;
  latitude: number | null;
  longitude: number | null;
  land_images: { image_url: string; is_primary: boolean }[];
}

export default function MapScreen() {
  const { t } = useI18n();
  const [lands, setLands] = useState<MapLand[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLands = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('lands')
        .select(`
          id, name, wilaya, commune, area, offer_type, verification_status, latitude, longitude,
          land_images(image_url, is_primary)
        `)
        .eq('is_published', true)
        .eq('verification_status', 'VERIFIED')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setLands(data as unknown as MapLand[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLands();
  }, [loadLands]);

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
      <PageHero title={t('map.title')} subtitle={`${lands.length} ${t('explore.results')}`} config={PAGE_HERO_CONFIG.map} />

      <View style={styles.mapPlaceholder}>
        <MapPinned size={80} color={Colors.primary.muted} />
        <Text style={styles.mapPlaceholderText}>{t('map.title')}</Text>
        <Text style={styles.mapPlaceholderSub}>{lands.length} {t('explore.results')}</Text>
      </View>

      <FlatList
        data={lands}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/land/${item.id}`)} activeOpacity={0.85}>
            <Card style={styles.landItem}>
              <View style={styles.landItemLeft}>
                <View style={styles.marker}>
                  <MapPin size={20} color={Colors.primary.main} />
                </View>
                <View style={styles.landItemInfo}>
                  <View style={styles.landItemHeader}>
                    <Text style={styles.landItemName} numberOfLines={1}>{item.name}</Text>
                    <BadgeCheck size={16} color={Colors.primary.main} />
                  </View>
                  <Text style={styles.landItemLocation}>{item.wilaya} - {item.commune}</Text>
                  <View style={styles.landItemFooter}>
                    <Text style={styles.landItemArea}>{item.area} {t('land.hectare')}</Text>
                    {getOfferLabel(item.offer_type) ? <Badge label={getOfferLabel(item.offer_type)} variant="primary" /> : null}
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.viewBtn} onPress={() => router.push(`/land/${item.id}`)}>
                <Text style={styles.viewBtnText}>{t('land.viewDetails')}</Text>
              </TouchableOpacity>
            </Card>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon={<MapPin size={48} color={Colors.neutral.border} />} title={t('map.noLands')} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { padding: 16, backgroundColor: Colors.neutral.white, borderBottomWidth: 1, borderBottomColor: Colors.neutral.borderLight },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.neutral.text, fontFamily: 'System' },
  headerSubtitle: { fontSize: 14, color: Colors.neutral.textMuted, marginTop: 4, fontFamily: 'System' },
  mapPlaceholder: { height: 200, backgroundColor: Colors.primary.bg, alignItems: 'center', justifyContent: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  mapPlaceholderText: { fontSize: 18, fontWeight: '700', color: Colors.primary.main, marginTop: 12, fontFamily: 'System' },
  mapPlaceholderSub: { fontSize: 14, color: Colors.primary.textLight, marginTop: 4, fontFamily: 'System' },
  list: { padding: 16, gap: 10 },
  landItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  landItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  marker: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary.bg, alignItems: 'center', justifyContent: 'center' },
  landItemInfo: { flex: 1 },
  landItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  landItemName: { fontSize: 16, fontWeight: '700', color: Colors.neutral.text, flex: 1, fontFamily: 'System' },
  landItemLocation: { fontSize: 13, color: Colors.neutral.textMuted, marginTop: 2, fontFamily: 'System' },
  landItemFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  landItemArea: { fontSize: 14, fontWeight: '600', color: Colors.primary.main, fontFamily: 'System' },
  viewBtn: { backgroundColor: Colors.primary.bg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.sm },
  viewBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary.main, fontFamily: 'System' },
});
