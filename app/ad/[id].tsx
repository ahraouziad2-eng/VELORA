import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, Share, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight, MapPin, Share2, Star } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/SafeImage';
import { AdTile, AD_SUMMARY_COLUMNS, type AdSummary } from '@/components/AdTile';
import { ContactActions } from '@/components/detail/ContactActions';
import { withTimeout } from '@/lib/withTimeout';
import { FALLBACK_IMAGE, type FallbackKind } from '@/src/data/demoImages';

const { width } = Dimensions.get('window');

type AdDetail = AdSummary & {
  description: string | null;
  brand: string | null;
  model: string | null;
  item_condition: string | null;
  with_driver: boolean | null;
  years_experience: number | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_name: string | null;
};

type GalleryPhoto = { id: string; image_url: string | null };

export default function AdDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ad, setAd] = useState<AdDetail | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [similar, setSimilar] = useState<AdSummary[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { width: viewportWidth } = useWindowDimensions();
  const isNarrow = viewportWidth < 768;

  useEffect(() => {
    if (!id) {
      setAd(null);
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setLoadFailed(false);
      try {
        const { data, error } = await withTimeout(supabase
          .from('advertisements')
          .select('id, title, description, category, price, price_unit, wilaya, image_url, rating_avg, rating_count, brand, model, item_condition, with_driver, years_experience, contact_phone, contact_whatsapp, contact_name')
          .eq('id', id)
          .eq('status', 'PUBLISHED')
          .maybeSingle());

        if (error) {
          setLoadFailed(true);
          setAd(null);
          return;
        }
        if (!data) {
          setAd(null);
          return;
        }
        const detail = data as unknown as AdDetail;
        setAd(detail);
        setLoading(false);

        const { data: galleryData } = await supabase
          .from('advertisement_images')
          .select('id, image_url, is_primary')
          .eq('advertisement_id', id)
          .order('is_primary', { ascending: false });
        setPhotos(galleryData && galleryData.length > 0 ? (galleryData as GalleryPhoto[]) : [{ id: 'cover', image_url: detail.image_url }]);

        const { data: similarData } = await supabase
          .from('advertisements')
          .select(AD_SUMMARY_COLUMNS)
          .eq('status', 'PUBLISHED')
          .eq('category', detail.category)
          .neq('id', id)
          .limit(4);
        setSimilar((similarData as unknown as AdSummary[]) ?? []);
      } catch {
        setLoadFailed(true);
        setAd(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, attempt]);

  if (loading) return <LoadingState />;
  if (!ad && loadFailed) {
    return (
      <EmptyState
        icon={<Star size={48} color={Colors.neutral.border} />}
        title="تعذر تحميل الإعلان"
        action={<Button title="إعادة المحاولة" onPress={() => setAttempt((n) => n + 1)} size="md" />}
      />
    );
  }
  if (!ad) {
    return (
      <EmptyState
        icon={<Star size={48} color={Colors.neutral.border} />}
        title="هذا الإعلان غير متوفر"
        action={<Button title="رجوع" onPress={() => router.back()} size="md" />}
      />
    );
  }

  const isService = ad.category === 'SERVICES';
  const fallbackKind: FallbackKind = isService ? 'services' : 'equipment';
  const priceText = ad.price != null ? `${ad.price.toLocaleString('en-US')} دج ${ad.price_unit ?? ''}`.trim() : 'السعر عند الاتفاق';
  const details: { label: string; value: string }[] = [
    ...(ad.brand ? [{ label: 'الماركة', value: ad.brand }] : []),
    ...(ad.model ? [{ label: 'الموديل', value: ad.model }] : []),
    ...(ad.item_condition ? [{ label: 'الحالة', value: ad.item_condition }] : []),
    ...(ad.with_driver != null ? [{ label: 'السائق', value: ad.with_driver ? 'مع سائق' : 'بدون سائق' }] : []),
    ...(ad.years_experience != null ? [{ label: 'سنوات الخبرة', value: `${ad.years_experience} سنة` }] : []),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topBtn}>
          <ChevronRight size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => void Share.share({ message: `${ad.title} - ${ad.wilaya}` })} style={[styles.topBtn, styles.topBtnSpaced]}>
          <Share2 size={20} color={Colors.neutral.white} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={(e) => setActivePhoto(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <SafeImage uri={item.image_url} fallback={FALLBACK_IMAGE[fallbackKind]} style={styles.galleryImage} />
          )}
        />
        {photos.length > 1 && (
          <View style={styles.dots}>
            {photos.map((photo, i) => (
              <View key={photo.id} style={[styles.dot, i === activePhoto && styles.dotActive]} />
            ))}
          </View>
        )}

        <View style={[styles.content, isNarrow && styles.contentWithBar]}>
          <Text style={styles.category}>{isService ? 'خدمة فلاحية' : 'معدات للكراء'}</Text>
          <Text style={styles.title}>{ad.title}</Text>

          <View style={styles.metaRow}>
            <MapPin size={16} color={Colors.neutral.textMuted} />
            <Text style={styles.metaText}>{ad.wilaya}</Text>
            {isService && ad.rating_avg != null && (
              <>
                <Star size={16} color="#C9942E" fill="#C9942E" />
                <Text style={styles.metaText}>{ad.rating_avg} ({ad.rating_count} تقييم)</Text>
              </>
            )}
          </View>

          <Text style={styles.price}>{priceText}</Text>

          {details.length > 0 && (
            <View style={styles.detailsCard}>
              {details.map((item) => (
                <View key={item.label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={styles.detailValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}

          {ad.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>التفاصيل</Text>
              <Text style={styles.sectionText}>{ad.description}</Text>
            </View>
          )}

          {!isNarrow && (
            <View style={styles.section}>
              <ContactActions layout="card" phone={ad.contact_phone} whatsapp={ad.contact_whatsapp} contactName={ad.contact_name} adTitle={ad.title} />
            </View>
          )}

          {similar.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>إعلانات مشابهة</Text>
              <View style={styles.similarGrid}>
                {similar.map((item) => (
                  <AdTile key={item.id} ad={item} style={styles.similarItem} />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {isNarrow && (
        <ContactActions layout="bar" phone={ad.contact_phone} whatsapp={ad.contact_whatsapp} contactName={ad.contact_name} adTitle={ad.title} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.white },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'flex-start', paddingTop: 50, paddingHorizontal: 16, zIndex: 10 },
  topBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  galleryImage: { width, height: 280 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.neutral.border },
  dotActive: { backgroundColor: Colors.primary.main },
  content: { padding: 16, paddingBottom: 48 },
  category: { color: '#A16207', fontSize: 13, fontWeight: '700', fontFamily: 'System' },
  title: { fontSize: 24, fontWeight: '800', color: Colors.neutral.text, marginTop: 6, fontFamily: 'System' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  metaText: { fontSize: 14, color: Colors.neutral.textMuted, marginRight: 8, fontFamily: 'System' },
  price: { fontSize: 22, fontWeight: '800', color: Colors.primary.main, marginTop: 14, fontFamily: 'System' },
  detailsCard: { marginTop: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: Colors.neutral.borderLight, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.neutral.borderLight },
  detailLabel: { fontSize: 14, color: Colors.neutral.textMuted, fontFamily: 'System' },
  detailValue: { fontSize: 14, fontWeight: '700', color: Colors.neutral.text, fontFamily: 'System' },
  section: { marginTop: 22 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.neutral.text, marginBottom: 8, fontFamily: 'System' },
  sectionText: { fontSize: 15, color: Colors.neutral.textLight, lineHeight: 24, fontFamily: 'System' },
  contentWithBar: { paddingBottom: 200 },
  topBtnSpaced: { marginLeft: 8 },
  similarGrid: { gap: 12 },
  similarItem: { width: '100%' },
});
