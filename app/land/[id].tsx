import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, Alert, Share, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MapPin, BadgeCheck, Heart, Share2, Flag, TrendingUp, Home, Handshake, FileText, ChevronRight, ChevronLeft, Info, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { AccountRequiredModal } from '@/components/ui/AccountRequiredModal';
import { SafeImage } from '@/components/SafeImage';
import { FALLBACK_IMAGE } from '@/src/data/demoImages';
import { ContactActions } from '@/components/detail/ContactActions';
import { withTimeout } from '@/lib/withTimeout';
import { landDetailPath } from '@/lib/detailPaths';

const { width } = Dimensions.get('window');

interface LandDetail {
  id: string;
  owner_id: string;
  name: string;
  wilaya: string;
  commune: string;
  region: string | null;
  area: number;
  land_type: string;
  offer_type: string;
  verification_status: string;
  description: string | null;
  agricultural_info: string | null;
  price: number | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_name: string | null;
}

interface LandImageRow {
  id: string;
  image_url: string;
  is_primary: boolean;
}

interface SimilarLand {
  id: string;
  name: string;
  wilaya: string;
  commune: string;
  area: number;
  offer_type: string;
  price: number | null;
  land_images: { image_url: string; is_primary: boolean }[];
}

export default function LandDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, guestMode } = useAuth();
  const { t } = useI18n();
  const { show } = useToast();
  const [land, setLand] = useState<LandDetail | null>(null);
  const [images, setImages] = useState<LandImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [showAccountRequired, setShowAccountRequired] = useState(false);
  const [similarLands, setSimilarLands] = useState<SimilarLand[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const { width: viewportWidth } = useWindowDimensions();
  const isNarrow = viewportWidth < 768;

  const loadLand = useCallback(async () => {
    if (!id) {
      setLand(null);
      setLoading(false);
      return;
    }
    setLoadFailed(false);
    try {
      const { data, error } = await withTimeout(supabase
        .from('lands')
        .select('*')
        .eq('id', id)
        .maybeSingle());

      if (error) {
        setLoadFailed(true);
        setLand(null);
        return;
      }
      if (!data) {
        setLand(null);
        return;
      }
      setLand(data as LandDetail);
      setLoading(false);

      const { data: imgData } = await supabase
        .from('land_images')
        .select('id, image_url, is_primary')
        .eq('land_id', id)
        .order('is_primary', { ascending: false });
      if (imgData) setImages(imgData as LandImageRow[]);

      const { data: similarData } = await supabase
        .from('lands')
        .select('id, name, wilaya, commune, area, offer_type, price, land_images(image_url, is_primary)')
        .eq('is_published', true)
        .eq('verification_status', 'VERIFIED')
        .eq('offer_type', data.offer_type)
        .neq('id', id)
        .limit(4);
      setSimilarLands((similarData as unknown as SimilarLand[]) ?? []);

      if (user) {
        const { data: fav } = await supabase
          .from('favorites')
          .select('id')
          .eq('land_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        setIsFavorite(!!fav);
      }
    } catch {
      setLoadFailed(true);
      setLand(null);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadLand();
  }, [loadLand]);

  const toggleFavorite = async () => {
    if (guestMode || !user) {
      setShowAccountRequired(true);
      return;
    }
    if (!id) return;
    try {
      if (isFavorite) {
        await supabase.from('favorites').delete().eq('land_id', id).eq('user_id', user.id);
        setIsFavorite(false);
        show(t('favorites.removed'), 'info');
      } else {
        await supabase.from('favorites').insert({ land_id: id, user_id: user.id });
        setIsFavorite(true);
        show(t('favorites.added'), 'success');
      }
    } catch {
      show(t('common.error'), 'error');
    }
  };

  const handleShare = async () => {
    if (!land) return;
    try {
      await Share.share({ message: `${land.name} - ${land.wilaya} - ${land.area} ${t('land.hectare')}` });
    } catch {
      // silent
    }
  };

  const handleReport = () => {
    if (guestMode) {
      setShowAccountRequired(true);
      return;
    }
    router.push({ pathname: '/report', params: { targetType: 'land', targetId: id } });
  };

  const handleRequest = (type: 'investment' | 'rental' | 'partnership') => {
    if (guestMode) {
      setShowAccountRequired(true);
      return;
    }
    router.push({ pathname: '/request/[type]', params: { type, landId: id } });
  };

  const getOfferLabel = (offer: string) => {
    const map: Record<string, string> = {
      FOR_RENT: t('offerType.forRent'),
      FOR_PARTNERSHIP: t('offerType.forPartnership'),
      FOR_INVESTMENT: t('offerType.forInvestment'),
    };
    return map[offer] || '';
  };

  const getLandTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      AGRICULTURAL: t('landType.agricultural'),
      GRAZING: t('landType.grazing'),
      ARABLE: t('landType.arable'),
      IRRIGATED: t('landType.irrigated'),
      GREENHOUSE: t('landType.greenhouse'),
      ORCHARD: t('landType.orchard'),
      OTHER: t('landType.other'),
    };
    return map[type] || type;
  };

  if (loading) return <LoadingState />;
  if (!land && loadFailed) {
    return (
      <EmptyState
        icon={<Info size={48} color={Colors.neutral.border} />}
        title="تعذر تحميل الإعلان"
        action={<Button title="إعادة المحاولة" onPress={() => { setLoading(true); void loadLand(); }} size="md" />}
      />
    );
  }
  if (!land) {
    return (
      <EmptyState
        icon={<Info size={48} color={Colors.neutral.border} />}
        title="هذا الإعلان غير متوفر"
        action={<Button title="رجوع" onPress={() => router.back()} size="md" />}
      />
    );
  }

  const isOwner = user?.id === land.owner_id;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topBtn}>
          <ChevronRight size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
        <View style={styles.topActions}>
          <TouchableOpacity onPress={toggleFavorite} style={styles.topBtn}>
            <Heart size={22} color={isFavorite ? Colors.error.main : Colors.neutral.white} fill={isFavorite ? Colors.error.main : 'none'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.topBtn}>
            <Share2 size={20} color={Colors.neutral.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReport} style={styles.topBtn}>
            <Flag size={20} color={Colors.neutral.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {images.length > 0 ? (
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(e) => setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => (
              <SafeImage uri={item.image_url} fallback={FALLBACK_IMAGE.lands} style={styles.galleryImage} />
            )}
          />
        ) : (
          <SafeImage uri={null} fallback={FALLBACK_IMAGE.lands} style={styles.galleryImage} />
        )}
        {images.length > 1 && (
          <View style={styles.galleryDots}>
            {images.map((_, i) => (
              <View key={i} style={[styles.galleryDot, i === activeImage && styles.galleryDotActive]} />
            ))}
          </View>
        )}

        <View style={[styles.content, isNarrow && styles.contentWithBar]}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{land.name}</Text>
            {land.verification_status === 'VERIFIED' && <BadgeCheck size={24} color={Colors.primary.main} />}
          </View>

          <View style={styles.locationRow}>
            <MapPin size={16} color={Colors.neutral.textMuted} />
            <Text style={styles.locationText}>{land.wilaya} - {land.commune}{land.region ? ` - ${land.region}` : ''}</Text>
          </View>

          <View style={styles.badgesRow}>
            <Badge label={getLandTypeLabel(land.land_type)} variant="neutral" />
            {getOfferLabel(land.offer_type) ? <Badge label={getOfferLabel(land.offer_type)} variant="primary" /> : null}
            {land.verification_status === 'VERIFIED' && <Badge label={t('land.verified')} variant="success" />}
          </View>

          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{land.area}</Text>
              <Text style={styles.statLabel}>{t('land.hectare')}</Text>
            </Card>
            {land.price != null && (
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{land.price.toLocaleString()}</Text>
                <Text style={styles.statLabel}>DZD</Text>
              </Card>
            )}
          </View>

          {land.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('land.description')}</Text>
              <Text style={styles.sectionText}>{land.description}</Text>
            </View>
          )}

          {land.agricultural_info && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('land.agriculturalInfo')}</Text>
              <Text style={styles.sectionText}>{land.agricultural_info}</Text>
            </View>
          )}

          {land.verification_status === 'VERIFIED' && (
            <Card style={styles.verifiedNote}>
              <ShieldCheck size={20} color={Colors.primary.main} />
              <Text style={styles.verifiedText}>{t('land.verifiedBadge')}</Text>
            </Card>
          )}

          {!isOwner && !isNarrow && (
            <View style={styles.section}>
              <ContactActions layout="card" phone={land.contact_phone} whatsapp={land.contact_whatsapp} contactName={land.contact_name} adTitle={land.name} />
            </View>
          )}

          {!isOwner && (
            <View style={styles.requestBlock}>
              {land.offer_type === 'FOR_INVESTMENT' && (
                <Button title={t('land.investmentRequest')} onPress={() => handleRequest('investment')} fullWidth size="lg" icon={<TrendingUp size={20} color={Colors.neutral.white} />} />
              )}
              {land.offer_type === 'FOR_RENT' && (
                <Button title={t('land.rentalRequest')} onPress={() => handleRequest('rental')} fullWidth size="lg" icon={<Home size={20} color={Colors.neutral.white} />} />
              )}
              {land.offer_type === 'FOR_PARTNERSHIP' && (
                <Button title={t('land.partnershipRequest')} onPress={() => handleRequest('partnership')} fullWidth size="lg" icon={<Handshake size={20} color={Colors.neutral.white} />} />
              )}
              {land.offer_type === 'NONE' && (
                <View style={styles.noOfferRow}>
                  <Button title={t('land.investmentRequest')} onPress={() => handleRequest('investment')} variant="outline" size="md" icon={<TrendingUp size={18} color={Colors.primary.main} />} />
                  <Button title={t('land.rentalRequest')} onPress={() => handleRequest('rental')} variant="outline" size="md" icon={<Home size={18} color={Colors.primary.main} />} />
                  <Button title={t('land.partnershipRequest')} onPress={() => handleRequest('partnership')} variant="outline" size="md" icon={<Handshake size={18} color={Colors.primary.main} />} />
                </View>
              )}
            </View>
          )}

          <Card style={styles.legalNote}>
            <Info size={18} color={Colors.warning.main} />
            <Text style={styles.legalNoteText}>{t('land.legalNote')}</Text>
          </Card>

          {similarLands.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>أراضٍ مشابهة</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarRow}>
                {similarLands.map((similar) => {
                  const cover = similar.land_images.find((img) => img.is_primary)?.image_url ?? similar.land_images[0]?.image_url;
                  return (
                    <TouchableOpacity key={similar.id} activeOpacity={0.85} onPress={() => router.push(landDetailPath(similar))} style={styles.similarCard}>
                      <SafeImage uri={cover} fallback={FALLBACK_IMAGE.lands} style={styles.similarImage} />
                      <View style={styles.similarBody}>
                        <Text style={styles.similarName} numberOfLines={1}>{similar.name}</Text>
                        <Text style={styles.similarMeta} numberOfLines={1}>{similar.wilaya} - {similar.area} {t('land.hectare')}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {!isOwner && isNarrow && (
        <ContactActions layout="bar" phone={land.contact_phone} whatsapp={land.contact_whatsapp} contactName={land.contact_name} adTitle={land.name} />
      )}

      <AccountRequiredModal visible={showAccountRequired} onDismiss={() => setShowAccountRequired(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.white },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.2)' },
  topBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  topActions: { flexDirection: 'row', gap: 4 },
  galleryImage: { width, height: 280 },
  galleryDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: -24, marginBottom: 8 },
  galleryDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  galleryDotActive: { backgroundColor: Colors.neutral.white },
  content: { padding: 16 },
  contentWithBar: { paddingBottom: 200 },
  requestBlock: { marginTop: 20, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.neutral.text, flex: 1, fontFamily: 'System' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  locationText: { fontSize: 15, color: Colors.neutral.textMuted, fontFamily: 'System' },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  statsGrid: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.primary.main, fontFamily: 'System' },
  statLabel: { fontSize: 13, color: Colors.neutral.textMuted, marginTop: 4, fontFamily: 'System' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.neutral.text, marginBottom: 8, fontFamily: 'System' },
  sectionText: { fontSize: 15, color: Colors.neutral.textLight, lineHeight: 24, fontFamily: 'System' },
  verifiedNote: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, backgroundColor: Colors.primary.bg, borderColor: Colors.primary.border },
  verifiedText: { flex: 1, fontSize: 13, color: Colors.primary.text, lineHeight: 20, fontFamily: 'System' },
  legalNote: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, backgroundColor: Colors.warning.bg, borderColor: Colors.warning.border },
  legalNoteText: { flex: 1, fontSize: 13, color: Colors.warning.text, lineHeight: 20, fontFamily: 'System' },
  noOfferRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  similarRow: { gap: 12, paddingVertical: 4 },
  similarCard: { width: 200, backgroundColor: Colors.neutral.white, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.neutral.borderLight },
  similarImage: { width: '100%', height: 120 },
  similarBody: { padding: 12, gap: 4 },
  similarName: { fontSize: 14, fontWeight: '700', color: Colors.neutral.text, fontFamily: 'System' },
  similarMeta: { fontSize: 12, color: Colors.neutral.textMuted, fontFamily: 'System' },
});
