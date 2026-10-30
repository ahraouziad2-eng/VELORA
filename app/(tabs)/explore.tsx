import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Search, SlidersHorizontal, MapPin, BadgeCheck, X } from 'lucide-react-native';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Select } from '@/components/ui/Select';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { WILAYAS } from '@/constants/wilayas';
import { PageHero } from '@/components/PageHero';
import { PAGE_HERO_CONFIG } from '@/constants/pageHero';
import { SafeImage } from '@/components/SafeImage';
import { FALLBACK_IMAGE } from '@/src/data/demoImages';

interface LandRow {
  id: string;
  name: string;
  wilaya: string;
  commune: string;
  area: number;
  land_type: string;
  offer_type: string;
  verification_status: string;
  price: number | null;
  description: string | null;
  land_images: { image_url: string; is_primary: boolean }[];
}

export default function ExploreScreen() {
  const { t } = useI18n();
  const { search: initialSearch, wilaya: initialWilaya, commune: initialCommune } = useLocalSearchParams<{ search?: string; wilaya?: string; commune?: string }>();
  const [lands, setLands] = useState<LandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterWilaya, setFilterWilaya] = useState(initialWilaya || '');
  const [filterCommune, setFilterCommune] = useState(initialCommune || '');
  const [filterLandType, setFilterLandType] = useState('');
  const [filterOfferType, setFilterOfferType] = useState('');

  const loadLands = useCallback(async () => {
    try {
      let query = supabase
        .from('lands')
        .select(`
          id, name, wilaya, commune, area, land_type, offer_type, verification_status, price, description,
          land_images(image_url, is_primary)
        `)
        .eq('is_published', true)
        .eq('verification_status', 'VERIFIED')
        .order('created_at', { ascending: false });

      if (filterWilaya) query = query.eq('wilaya', filterWilaya);
      if (filterCommune) query = query.eq('commune', filterCommune);
      if (filterLandType) query = query.eq('land_type', filterLandType);
      if (filterOfferType) query = query.eq('offer_type', filterOfferType);
      if (search) query = query.or(`name.ilike.%${search}%,commune.ilike.%${search}%,description.ilike.%${search}%`);

      const { data, error } = await query.limit(50);
      if (!error && data) {
        setLands(data as unknown as LandRow[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterWilaya, filterCommune, filterLandType, filterOfferType, search]);

  useEffect(() => {
    setLoading(true);
    loadLands();
  }, [loadLands]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLands();
  }, [loadLands]);

  const clearFilters = () => {
    setFilterWilaya('');
    setFilterCommune('');
    setFilterLandType('');
    setFilterOfferType('');
    setSearch('');
  };

  useEffect(() => {
    if (initialSearch !== undefined) setSearch(initialSearch);
  }, [initialSearch]);

  const getOfferBadge = (offer: string) => {
    const map: Record<string, { label: string; variant: 'primary' | 'secondary' | 'accent' | 'neutral' }> = {
      FOR_RENT: { label: t('offerType.forRent'), variant: 'primary' },
      FOR_PARTNERSHIP: { label: t('offerType.forPartnership'), variant: 'accent' },
      FOR_INVESTMENT: { label: t('offerType.forInvestment'), variant: 'secondary' },
    };
    return map[offer] || { label: '', variant: 'neutral' };
  };

  const getPrimaryImage = (land: LandRow) => {
    const primary = land.land_images?.find((img) => img.is_primary);
    return primary?.image_url || land.land_images?.[0]?.image_url;
  };

  const renderItem = ({ item }: { item: LandRow }) => {
    const img = getPrimaryImage(item);
    const badge = getOfferBadge(item.offer_type);
    return (
      <TouchableOpacity onPress={() => router.push(`/land/${item.id}`)} activeOpacity={0.85}>
        <Card style={styles.card}>
          <SafeImage uri={img ?? null} fallback={FALLBACK_IMAGE.lands} style={styles.cardImage} />
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
              <BadgeCheck size={18} color={Colors.primary.main} />
            </View>
            <View style={styles.cardMeta}>
              <MapPin size={14} color={Colors.neutral.textMuted} />
              <Text style={styles.cardMetaText}>{item.wilaya} - {item.commune}</Text>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardArea}>{item.area} {t('land.hectare')}</Text>
              {badge.label ? <Badge label={badge.label} variant={badge.variant} /> : null}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <PageHero title="الأراضي الفلاحية" subtitle="اكتشف الأراضي المتاحة للبيع والكراء والشراكة" config={PAGE_HERO_CONFIG.explore} />
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Search size={18} color={Colors.neutral.light} />
          <TextInput
            style={styles.searchText}
            placeholder={t('explore.search')}
            placeholderTextColor={Colors.neutral.light}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={Colors.neutral.light} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={20} color={Colors.primary.main} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filters}>
          <SearchableSelect
            label={t('land.wilaya')}
            value={filterWilaya}
            options={WILAYAS.map((w) => ({ label: `${w.nameAr} (${w.code})`, value: w.nameAr }))}
            onSelect={(value) => { setFilterWilaya(value); setFilterCommune(''); }}
            placeholder={t('common.all')}
          />
          <SearchableSelect
            label={t('land.commune')}
            value={filterCommune}
            options={filterWilaya ? WILAYAS.find((wilaya) => wilaya.nameAr === filterWilaya)?.communes.map((commune) => ({ label: commune, value: commune })) || [] : []}
            onSelect={setFilterCommune}
            placeholder={t('common.all')}
          />
          <Select
            label={t('land.type')}
            value={filterLandType}
            options={[
              { label: t('landType.agricultural'), value: 'AGRICULTURAL' },
              { label: t('landType.grazing'), value: 'GRAZING' },
              { label: t('landType.arable'), value: 'ARABLE' },
              { label: t('landType.irrigated'), value: 'IRRIGATED' },
              { label: t('landType.greenhouse'), value: 'GREENHOUSE' },
              { label: t('landType.orchard'), value: 'ORCHARD' },
              { label: t('landType.other'), value: 'OTHER' },
            ]}
            onSelect={setFilterLandType}
            placeholder={t('common.all')}
          />
          <Select
            label={t('land.offerType')}
            value={filterOfferType}
            options={[
              { label: t('offerType.forRent'), value: 'FOR_RENT' },
              { label: t('offerType.forPartnership'), value: 'FOR_PARTNERSHIP' },
              { label: t('offerType.forInvestment'), value: 'FOR_INVESTMENT' },
            ]}
            onSelect={setFilterOfferType}
            placeholder={t('common.all')}
          />
          <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>{t('explore.clearFilters')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={lands}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.main]} />}
        ListEmptyComponent={<EmptyState icon={<Search size={48} color={Colors.neutral.border} />} title={t('explore.noResults')} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  searchBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: Colors.neutral.white, borderBottomWidth: 1, borderBottomColor: Colors.neutral.borderLight },
  searchInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.neutral.surface, borderRadius: radius.md, paddingHorizontal: 12, gap: 8, height: 44 },
  searchText: { flex: 1, fontSize: 15, color: Colors.neutral.text, fontFamily: 'System' },
  filterBtn: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: Colors.primary.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary.border },
  filters: { backgroundColor: Colors.neutral.white, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.neutral.borderLight },
  clearBtn: { alignSelf: 'flex-end', marginTop: 8 },
  clearBtnText: { color: Colors.error.main, fontSize: 14, fontWeight: '600', fontFamily: 'System' },
  list: { padding: 16, gap: 12 },
  card: { padding: 0, overflow: 'hidden' },
  cardImage: { width: '100%', height: 180 },
  cardBody: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.neutral.text, flex: 1, fontFamily: 'System' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  cardMetaText: { fontSize: 14, color: Colors.neutral.textMuted, fontFamily: 'System' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cardArea: { fontSize: 16, fontWeight: '600', color: Colors.primary.main, fontFamily: 'System' },
});
