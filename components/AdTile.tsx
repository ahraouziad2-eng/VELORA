import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { MapPin, Star } from 'lucide-react-native';
import { SafeImage } from '@/components/SafeImage';
import { FALLBACK_IMAGE, type FallbackKind } from '@/src/data/demoImages';
import { adDetailPath } from '@/lib/detailPaths';

export const AD_SUMMARY_COLUMNS = 'id, title, category, price, price_unit, wilaya, image_url, rating_avg, rating_count';

export type AdSummary = {
  id: string;
  title: string;
  category: string;
  price: number | null;
  price_unit: string | null;
  wilaya: string;
  image_url: string | null;
  rating_avg: number | null;
  rating_count: number;
};

type AdTileProps = {
  ad: AdSummary;
  style?: ViewStyle;
};

export function AdTile({ ad, style }: AdTileProps) {
  const isService = ad.category === 'SERVICES';
  const fallbackKind: FallbackKind = isService ? 'services' : 'equipment';
  const priceText = ad.price != null
    ? `${ad.price.toLocaleString('en-US')} دج ${ad.price_unit ?? ''}`.trim()
    : 'السعر عند الاتفاق';

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(adDetailPath(ad))} style={[styles.card, style]}>
      <SafeImage uri={ad.image_url} fallback={FALLBACK_IMAGE[fallbackKind]} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.category}>{isService ? 'خدمة فلاحية' : 'معدات للكراء'}</Text>
        <Text style={styles.title} numberOfLines={2}>{ad.title}</Text>
        <View style={styles.row}>
          <MapPin size={13} color="#5F6B64" />
          <Text style={styles.meta}>{ad.wilaya}</Text>
        </View>
        {isService && ad.rating_avg != null && (
          <View style={styles.row}>
            <Star size={13} color="#C9942E" fill="#C9942E" />
            <Text style={styles.meta}>{ad.rating_avg} ({ad.rating_count})</Text>
          </View>
        )}
        <Text style={styles.price}>{priceText}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#EAE4D3' },
  image: { width: '100%', aspectRatio: 1.6 },
  body: { padding: 14, gap: 6 },
  category: { color: '#A16207', fontSize: 11, fontWeight: '700', fontFamily: 'Cairo' },
  title: { color: '#1F2A24', fontSize: 15, fontWeight: '800', lineHeight: 22, fontFamily: 'Cairo' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { color: '#5F6B64', fontSize: 12, fontFamily: 'Cairo' },
  price: { color: '#1B5E45', fontSize: 14, fontWeight: '800', marginTop: 4, fontFamily: 'Cairo' },
});
