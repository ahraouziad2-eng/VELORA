import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, FlatList, Image, TextInput, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowUpRight,
  Bell,
  BadgeCheck,
  ChevronLeft,
  Compass,
  MapPin,
  MapPinned,
  Search,
  Plus,
  Sprout,
  Tractor,
  UsersRound,
  Wrench,
  Droplets,
  Route,
  Ruler,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import { BrandLogo } from '@/components/BrandLogo';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { WILAYAS } from '@/constants/wilayas';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { AccountRequiredModal } from '@/components/ui/AccountRequiredModal';
import { SafeImage } from '@/components/SafeImage';
import { AdTile, AD_SUMMARY_COLUMNS, type AdSummary } from '@/components/AdTile';
import { FALLBACK_IMAGE } from '@/src/data/demoImages';
import { LogIn, UserPlus, X } from 'lucide-react-native';

type HomeRoute = '/(tabs)/explore' | '/(tabs)/ads';

type LandWithImages = {
  id: string;
  name: string;
  wilaya: string;
  commune: string;
  area: number;
  land_type: string;
  offer_type: string;
  verification_status: string;
  price: number | null;
  land_images: { image_url: string; is_primary: boolean }[];
};

type ServiceCard = {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
  backgroundColor: string;
  route: HomeRoute;
};

type BannerSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string;
};

const AD_SUMMARY_COLUMNS_UNUSED = '';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { guestMode, exitGuestMode } = useAuth();
  const { t } = useI18n();
  const [lands, setLands] = useState<LandWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAccountRequired, setShowAccountRequired] = useState(false);
  const [guestBannerDismissed, setGuestBannerDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchWilaya, setSearchWilaya] = useState('');
  const [searchCommune, setSearchCommune] = useState('');
  const [equipment, setEquipment] = useState<AdSummary[]>([]);
  const [services, setServices] = useState<AdSummary[]>([]);
  const [latest, setLatest] = useState<AdSummary[]>([]);
  const [banners, setBanners] = useState<BannerSlide[]>([]);

  const loadLands = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('lands')
        .select(`
          id, name, wilaya, commune, area, land_type, offer_type, verification_status, price,
          land_images(image_url, is_primary)
        `)
        .eq('is_published', true)
        .eq('verification_status', 'VERIFIED')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setLands(data as unknown as LandWithImages[]);
      }
    } catch {
      // Keep the home experience available when optional recommendations fail.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadAds = useCallback(async () => {
    try {
      const [equipmentRes, servicesRes, bannersRes, latestRes] = await Promise.all([
        supabase.from('advertisements').select(AD_SUMMARY_COLUMNS).eq('status', 'PUBLISHED').eq('category', 'EQUIPMENT').order('created_at', { ascending: false }).limit(4),
        supabase.from('advertisements').select(AD_SUMMARY_COLUMNS).eq('status', 'PUBLISHED').eq('category', 'SERVICES').order('created_at', { ascending: false }).limit(4),
        supabase.from('banners').select('id, title, subtitle, image_url, link_url').eq('is_active', true).order('display_order').limit(4),
        supabase.from('advertisements').select(AD_SUMMARY_COLUMNS).eq('status', 'PUBLISHED').order('created_at', { ascending: false }).limit(4),
      ]);
      if (!equipmentRes.error && equipmentRes.data) setEquipment(equipmentRes.data as unknown as AdSummary[]);
      if (!servicesRes.error && servicesRes.data) setServices(servicesRes.data as unknown as AdSummary[]);
      if (!bannersRes.error && bannersRes.data) setBanners(bannersRes.data as BannerSlide[]);
      if (!latestRes.error && latestRes.data) setLatest(latestRes.data as unknown as AdSummary[]);
    } catch {
      // Sections stay hidden when the optional content cannot be loaded.
    }
  }, []);

  const loadUnread = useCallback(async () => {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      setUnreadCount(count || 0);
    } catch {
      // Keep the header usable when notifications are unavailable.
    }
  }, []);

  useEffect(() => {
    loadLands();
    loadAds();
    loadUnread();
  }, [loadLands, loadAds, loadUnread]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLands();
    loadAds();
    loadUnread();
  }, [loadLands, loadAds, loadUnread]);

  const openNotifications = () => {
    if (guestMode) {
      setShowAccountRequired(true);
      return;
    }
    router.push('/(tabs)/notifications');
  };

  const openService = (service: ServiceCard) => {
    if (service.route) router.push(service.route);
  };

  const communeOptions = searchWilaya
    ? WILAYAS.find((wilaya) => wilaya.nameAr === searchWilaya)?.communes.map((commune) => ({ label: commune, value: commune })) || []
    : [];

  const handleSearch = () => {
    router.push({
      pathname: '/(tabs)/explore',
      params: { search: searchQuery, wilaya: searchWilaya, commune: searchCommune },
    });
  };

  const goToLogin = () => {
    exitGuestMode();
    router.push('/(auth)/login');
  };

  const goToRegister = () => {
    exitGuestMode();
    router.push('/(auth)/register');
  };

  const serviceCards: ServiceCard[] = [
    {
      icon: <Sprout size={25} color={Colors.primary.main} />,
      title: 'أراضي فلاحية',
      description: 'للبيع، للكراء أو للشراكة',
      color: Colors.primary.main,
      backgroundColor: Colors.primary.bg,
      route: '/(tabs)/explore',
    },
    {
      icon: <Tractor size={25} color={Colors.secondary.main} />,
      title: 'معدات للكراء',
      description: 'جرارات، آلات ومعدات فلاحية',
      color: Colors.secondary.main,
      backgroundColor: Colors.secondary.bg,
      route: '/(tabs)/ads',
    },
    {
      icon: <Wrench size={25} color="#0F766E" />,
      title: 'خدمات فلاحية',
      description: 'الحرث، الري، الجني وما أكثر',
      color: '#0F766E',
      backgroundColor: '#F0FDFA',
      route: '/(tabs)/ads',
    },
    {
      icon: <UsersRound size={25} color="#A16207" />,
      title: 'شراكات واستثمار',
      description: 'فرص للتعاون والاستثمار الفلاحي',
      color: '#A16207',
      backgroundColor: '#FEFCE8',
      route: '/(tabs)/explore',
    },
  ];

  const getOfferBadge = (offer: string) => {
    const map: Record<string, { label: string; variant: 'primary' | 'secondary' | 'accent' | 'neutral' }> = {
      FOR_SALE: { label: 'للبيع', variant: 'primary' },
      FOR_RENT: { label: t('offerType.forRent'), variant: 'primary' },
      FOR_PARTNERSHIP: { label: t('offerType.forPartnership'), variant: 'accent' },
      FOR_INVESTMENT: { label: t('offerType.forInvestment'), variant: 'secondary' },
    };
    return map[offer] || { label: '', variant: 'neutral' };
  };

  const getPrimaryImage = (land: LandWithImages) => {
    const primary = land.land_images?.find((img) => img.is_primary);
    return primary?.image_url || land.land_images?.[0]?.image_url;
  };

  const getLandFeature = (land: LandWithImages) => {
    if (land.offer_type === 'FOR_PARTNERSHIP' || land.offer_type === 'FOR_INVESTMENT') return { label: 'استثمار فلاحي', icon: <TrendingUp size={14} color="#C9942E" /> };
    if (land.land_type.toLowerCase().includes('irrig')) return { label: 'مياه متوفرة', icon: <Droplets size={14} color="#1B5E45" /> };
    return { label: 'طريق متاح', icon: <Route size={14} color="#1B5E45" /> };
  };

  const renderLandCard = ({ item: land }: { item: LandWithImages }) => {
    const img = getPrimaryImage(land);
    const badge = getOfferBadge(land.offer_type);
    const feature = getLandFeature(land);
    return (
      <TouchableOpacity onPress={() => router.push(`/land/${land.id}`)} activeOpacity={0.85} style={[styles.landCardWrap, width >= 1024 ? styles.landCardThree : width >= 768 ? styles.landCardTwo : styles.landCardOne]}>
        <Card style={styles.landCard}>
          <View style={styles.landImageWrap}>
            <SafeImage uri={img} fallback={FALLBACK_IMAGE.lands} style={styles.landImage} />
            <View style={[styles.landBadge, { backgroundColor: land.offer_type === 'FOR_RENT' ? '#C9942E' : land.offer_type === 'FOR_PARTNERSHIP' || land.offer_type === 'FOR_INVESTMENT' ? '#8A641B' : '#1B5E45' }]}>
              <Text style={styles.landBadgeText}>{badge.label || 'عرض فلاحي'}</Text>
            </View>
          </View>
          <View style={styles.landInfo}>
            <View style={styles.landHeader}>
              <Text style={styles.landName} numberOfLines={1}>{land.name}</Text>
              <BadgeCheck size={18} color="#1B5E45" />
            </View>
            <View style={styles.landDetailsRow}>
              <View style={styles.landDetailItem}>
                <MapPin size={14} color="#5F6B64" />
                <Text style={styles.landMetaText} numberOfLines={1}>{land.wilaya} - {land.commune}</Text>
              </View>
              <View style={styles.landDetailItem}>
                <Ruler size={14} color="#5F6B64" />
                <Text style={styles.landMetaText}>{land.area} {t('land.hectare')}</Text>
              </View>
            </View>
            <View style={styles.landFeature}>
              {feature.icon}
              <Text style={styles.landFeatureText}>{feature.label}</Text>
            </View>
            <TouchableOpacity style={styles.landDetailsButton} onPress={() => router.push(`/land/${land.id}`)} activeOpacity={0.8}>
              <Text style={styles.landDetailsButtonText}>عرض التفاصيل</Text>
              <ArrowLeft size={15} color="#1B5E45" />
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const heroFontSize = width < 768 ? 28 : Math.min(Math.max(28, width * 0.032), 48);
  const bannerWidth = width >= 768 ? Math.min(width - 80, 1000) : width - 32;
  const adItemWidth = width >= 1024 ? '23.5%' : width >= 768 ? '48.5%' : '100%';

  if (loading) return <LoadingState />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.main]} />}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={width >= 768 ? [0] : undefined}
    >
      {width >= 768 && (
        <View style={styles.desktopHeader}>
          <TouchableOpacity style={styles.desktopBrand} onPress={() => router.push('/home')}>
            <BrandLogo variant="mark" size={34} />
            <Text style={styles.desktopBrandName}>VELORA</Text>
          </TouchableOpacity>
          <View style={styles.desktopNav}>
            <TouchableOpacity style={[styles.desktopNavLink, styles.desktopNavLinkActive]} onPress={() => router.push('/home')}>
              <Text style={[styles.desktopNavText, styles.desktopNavTextActive]}>الرئيسية</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.desktopNavLink} onPress={() => router.push('/explore')}>
              <Text style={styles.desktopNavText}>الأراضي الفلاحية</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.desktopNavLink} onPress={() => router.push('/ads')}>
              <Text style={styles.desktopNavText}>الخدمات والمعدات</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.desktopNavLink} onPress={() => setShowAccountRequired(true)}>
              <Text style={styles.desktopNavText}>كيف تعمل المنصة؟</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.desktopActions}>
            <TouchableOpacity style={styles.addListingButton} onPress={() => guestMode ? setShowAccountRequired(true) : router.push('/ads')}>
              <Plus size={17} color="#FFFFFF" />
              <Text style={styles.addListingText}>أضف إعلانك</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={guestMode ? goToLogin : () => router.push('/profile')}>
              <Text style={styles.loginLink}>{guestMode ? 'دخول' : 'حسابي'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[styles.hero, width < 768 && styles.heroMobile]}>
        <Image
          source={{ uri: '/hero-bg.webp.webp' }}
          style={[styles.heroImage, width < 768 && styles.heroImageMobile]}
          resizeMode="cover"
        />
        {width < 768 ? (
          <LinearGradient
            colors={['#FAF8F1', 'rgba(250,248,241,0)']}
            locations={[0, 0.33]}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={styles.heroFadeMobile}
          />
        ) : (
          <>
            <LinearGradient
              colors={['#FAF8F1', 'rgba(250,248,241,0)']}
              locations={[0, 0.195]}
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['#FAF8F1', '#FAF8F1', 'rgba(250,248,241,0.85)', 'rgba(250,248,241,0.4)', 'rgba(250,248,241,0)']}
              locations={[0, 0.3, 0.42, 0.56, 0.72]}
              start={{ x: 1, y: 0.5 }}
              end={{ x: 0, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </>
        )}
        <View style={[styles.heroInner, width < 768 && styles.heroInnerMobile]}>
          {width < 768 && (
            <View style={styles.mobileHeaderTop}>
              <View style={styles.brandRow}>
                <BrandLogo variant="mark" size={34} />
                <View style={styles.brandCopy}>
                  <Text style={styles.brandName}>VELORA</Text>
                  <Text style={styles.brandTagline}>{t('app.tagline')}</Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={openNotifications} style={styles.mobileIconButton} accessibilityLabel={t('notifications.title')}>
                  <Bell size={21} color="#1B5E45" />
                  {unreadCount > 0 && <View style={styles.badge} />}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/explore')} style={styles.mobileIconButton} accessibilityLabel={t('explore.search')}>
                  <Search size={21} color="#1B5E45" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle, { fontSize: heroFontSize, lineHeight: Math.round(heroFontSize * 1.4) }]}>
              <Text>أرضك، خدماتك وشركاؤك</Text>
              {'\n'}
              <Text>في الفلاحة ... في <Text style={styles.heroTitleAccent}>مكان واحد</Text></Text>
            </Text>
            <Text style={[styles.heroSubtitle, width < 768 && { fontSize: 16, lineHeight: 27 }]}>ابحث عن أرض فلاحية أو خدمة قريبة منك</Text>
          </View>
        </View>
      </View>

      <View style={[styles.searchPanel, width < 768 && styles.searchPanelMobile]}>
        <View style={[styles.searchControls, width < 768 && styles.searchControlsMobile]}>
          <View style={styles.searchInputRow}>
            <Search size={19} color="#1B5E45" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="ماذا تبحث عنه؟ مثال: أرض فلاحية، بستان زيتون، حرث، ري..."
              placeholderTextColor="#8A948D"
              style={[styles.searchInput, width < 768 && styles.searchInputMobile]}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          </View>
          <SearchableSelect
            value={searchWilaya}
            options={WILAYAS.map((wilaya) => ({ label: wilaya.nameAr, value: wilaya.nameAr }))}
            onSelect={(value) => { setSearchWilaya(value); setSearchCommune(''); }}
            placeholder="الولاية"
            style={[styles.locationSelect, width < 768 && styles.locationSelectMobile] as any}
          />
          {searchWilaya && (
            <SearchableSelect
              value={searchCommune}
              options={communeOptions}
              onSelect={setSearchCommune}
              placeholder="البلدية"
              style={[styles.locationSelect, width < 768 && styles.locationSelectMobile] as any}
            />
          )}
          <TouchableOpacity style={[styles.searchButton, width < 768 && styles.searchButtonMobile]} onPress={handleSearch} activeOpacity={0.85}>
            <Search size={19} color="#FFFFFF" />
            <Text style={styles.searchButtonText}>ابحث</Text>
          </TouchableOpacity>
        </View>
      </View>

      {guestMode && !guestBannerDismissed && (
        <View style={styles.guestBanner}>
          <View style={styles.guestBannerCopy}>
            <Text style={styles.guestBannerTitle}>{t('guest.requiredTitle')}</Text>
            <Text style={styles.guestBannerText}>{t('guest.requiredMessage')}</Text>
            <View style={styles.guestBannerActions}>
              <TouchableOpacity style={styles.guestBannerPrimaryBtn} onPress={goToLogin} activeOpacity={0.8}>
                <LogIn size={16} color="#FFFFFF" />
                <Text style={styles.guestBannerPrimaryText}>{t('guest.signIn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.guestBannerSecondaryBtn} onPress={goToRegister} activeOpacity={0.8}>
                <UserPlus size={16} color={Colors.primary.main} />
                <Text style={styles.guestBannerSecondaryText}>{t('guest.createAccount')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={() => setGuestBannerDismissed(true)} style={styles.guestBannerClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      )}

      {banners.length > 0 && (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.bannerRail} contentContainerStyle={styles.bannerTrack}>
          {banners.map((banner) => (
            <TouchableOpacity key={banner.id} activeOpacity={0.9} onPress={() => router.push(banner.link_url as any)} style={[styles.bannerSlide, { width: bannerWidth }]}>
              <SafeImage uri={banner.image_url} fallback={FALLBACK_IMAGE.lands} style={styles.bannerImage} />
              <LinearGradient colors={['rgba(13,59,32,0.88)', 'rgba(13,59,32,0.2)']} start={{ x: 1, y: 0.5 }} end={{ x: 0, y: 0.5 }} style={StyleSheet.absoluteFill} />
              <View style={styles.bannerCopy}>
                <Text style={styles.bannerTitle}>{banner.title}</Text>
                {banner.subtitle ? <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text> : null}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.servicesSection}>
        <View style={styles.sectionHeading}>
          <View style={styles.headingAccent} />
          <View style={styles.headingCopy}>
            <Text style={styles.sectionTitle}>استكشف بسرعة</Text>
            <Text style={styles.sectionSubtitle}>كل ما تحتاجه لنشاطك الفلاحي في مكان واحد.</Text>
          </View>
        </View>
        <View style={styles.servicesGrid}>
          {serviceCards.map((service) => (
            <TouchableOpacity key={service.title} activeOpacity={0.82} onPress={() => openService(service)} style={[styles.serviceCard, width >= 768 && styles.serviceCardDesktop]}>
              <View style={[styles.serviceIcon, { backgroundColor: service.backgroundColor }]}>{service.icon}</View>
              <View style={styles.serviceCopy}>
                <Text style={styles.serviceTitle} numberOfLines={1}>{service.title}</Text>
                <Text style={styles.serviceDescription} numberOfLines={2}>{service.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleGroup}>
            <View style={styles.sectionTitleAccent} />
            <Text style={styles.sectionTitleLarge}>اكتشف الأراضي الفلاحية</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/explore')} style={styles.viewAllRow}>
            <Text style={styles.viewAllText}>عرض الكل</Text>
            <ChevronLeft size={16} color="#1B5E45" />
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={styles.landGrid}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={[styles.skeletonCard, width < 768 && styles.skeletonCardMobile]}>
                <View style={[styles.skeletonBlock, styles.skeletonImage]} />
                <View style={styles.skeletonBody}>
                  <View style={[styles.skeletonBlock, styles.skeletonLineLarge]} />
                  <View style={[styles.skeletonBlock, styles.skeletonLine]} />
                  <View style={[styles.skeletonBlock, styles.skeletonLineShort]} />
                </View>
              </View>
            ))}
          </View>
        ) : lands.length === 0 ? (
          <View style={styles.emptyLands}>
            <Sprout size={42} color="#C9942E" />
            <Text style={styles.emptyLandsTitle}>لا توجد أراضي حالياً، كن أول من يضيف إعلانه</Text>
            <TouchableOpacity style={styles.emptyLandsButton} onPress={() => guestMode ? setShowAccountRequired(true) : router.push('/add-land')}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.emptyLandsButtonText}>أضف إعلانك</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            key={`land-grid-${width >= 1024 ? 3 : width >= 768 ? 2 : 1}`}
            data={lands}
            renderItem={renderLandCard}
            keyExtractor={(item) => item.id}
            numColumns={width >= 1024 ? 3 : width >= 768 ? 2 : 1}
            columnWrapperStyle={width >= 768 ? styles.landColumn : undefined}
            scrollEnabled={false}
            contentContainerStyle={styles.landGrid}
          />
        )}
      </View>

      {equipment.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <View style={styles.sectionTitleAccent} />
              <Text style={styles.sectionTitleLarge}>معدات مميزة</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/ads')} style={styles.viewAllRow}>
              <Text style={styles.viewAllText}>عرض الكل</Text>
              <ChevronLeft size={16} color="#1B5E45" />
            </TouchableOpacity>
          </View>
          <View style={styles.adGrid}>
            {equipment.map((ad) => <AdTile key={ad.id} ad={ad} style={{ width: adItemWidth }} />)}
          </View>
        </View>
      )}

      {services.length > 0 && (
        <View style={styles.nearbyServicesSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <View style={styles.sectionTitleAccent} />
              <Text style={styles.sectionTitleLarge}>خدمات قريبة منك</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/ads')} style={styles.viewAllRow}>
              <Text style={styles.viewAllText}>عرض الكل</Text>
              <ChevronLeft size={16} color="#1B5E45" />
            </TouchableOpacity>
          </View>
          <View style={styles.adGrid}>
            {services.map((ad) => <AdTile key={ad.id} ad={ad} style={{ width: adItemWidth }} />)}
          </View>
        </View>
      )}

      {latest.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <View style={styles.sectionTitleAccent} />
              <Text style={styles.sectionTitleLarge}>الأحدث</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/ads')} style={styles.viewAllRow}>
              <Text style={styles.viewAllText}>عرض الكل</Text>
              <ChevronLeft size={16} color="#1B5E45" />
            </TouchableOpacity>
          </View>
          <View style={styles.adGrid}>
            {latest.map((ad) => <AdTile key={ad.id} ad={ad} style={{ width: adItemWidth }} />)}
          </View>
        </View>
      )}

      <AccountRequiredModal visible={showAccountRequired} onDismiss={() => setShowAccountRequired(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F1' },
  content: { paddingBottom: 120 },
  desktopHeader: { height: 72, paddingHorizontal: 40, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#1F2A24', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, zIndex: 10 },
  desktopBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 180 },
  desktopBrandName: { color: '#1B5E45', fontSize: 20, fontWeight: '800', letterSpacing: 2, fontFamily: 'Cairo' },
  desktopNav: { flexDirection: 'row', alignItems: 'center', gap: 28, flex: 1, justifyContent: 'center' },
  desktopNavLink: { paddingVertical: 26, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  desktopNavLinkActive: { borderBottomColor: '#1B5E45' },
  desktopNavText: { color: '#5F6B64', fontSize: 14, fontWeight: '600', fontFamily: 'Cairo' },
  desktopNavTextActive: { color: '#1B5E45' },
  desktopActions: { flexDirection: 'row', alignItems: 'center', gap: 20, minWidth: 230, justifyContent: 'flex-end' },
  addListingButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1B5E45', borderRadius: 8, paddingHorizontal: 16, minHeight: 40 },
  addListingText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', fontFamily: 'Cairo' },
  loginLink: { color: '#1B5E45', fontSize: 14, fontWeight: '700', fontFamily: 'Cairo' },
  hero: { position: 'relative', overflow: 'hidden', backgroundColor: '#FAF8F1', minHeight: 460, flexDirection: 'row' },
  heroMobile: { minHeight: 0, flexDirection: 'column' },
  heroImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', zIndex: 0 },
  heroImageMobile: { position: 'relative', height: 240, width: '100%' },
  heroFadeMobile: { position: 'absolute', top: 0, left: 0, right: 0, height: 240, zIndex: 1 },
  heroInner: { position: 'relative', zIndex: 2, maxWidth: 1200, width: '100%', alignSelf: 'center', minHeight: 460, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  heroInnerMobile: { minHeight: 0, flexDirection: 'column', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 80 },
  heroContent: { maxWidth: 620, width: '100%' },
  mobileHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  brandCopy: { marginLeft: 10 },
  brandName: { fontSize: 16, fontWeight: '800', letterSpacing: 2, color: '#1B5E45', fontFamily: 'Cairo' },
  brandTagline: { fontSize: 10, color: '#5F6B64', marginTop: 3, maxWidth: 190, fontFamily: 'Cairo' },
  headerActions: { flexDirection: 'row', gap: 8 },
  mobileIconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#1F2A24', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  badge: { position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: '#C9942E', borderWidth: 1, borderColor: '#FFFFFF' },
  heroTitle: { marginBottom: 16, fontWeight: '800' as const, color: '#1B5E45', fontFamily: 'Cairo', textAlign: 'right' as const },
  heroTitleAccent: { color: '#C9942E', fontWeight: '800' as const },
  heroSubtitle: { fontSize: 19, lineHeight: 32, color: '#3F4A43', fontFamily: 'Cairo', textAlign: 'right' as const },
  searchPanel: { alignSelf: 'center', width: '92%', maxWidth: 960, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginTop: -48, shadowColor: '#1F2A24', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 7, zIndex: 3 },
  searchControls: { flexDirection: 'row', alignItems: 'center', gap: 10, direction: 'rtl' as const },
  searchInputRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#D8DED9', borderRadius: 10, paddingHorizontal: 12, height: 50 },
  searchInput: { flex: 1, color: '#1F2A24', fontSize: 14, textAlign: 'right', fontFamily: 'Cairo' },
  locationSelect: { width: 150, marginBottom: 0 },
  searchButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1B5E45', borderRadius: 10, minHeight: 50, paddingHorizontal: 24 },
  searchButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', fontFamily: 'Cairo' },
  searchPanelMobile: { width: '92%', marginTop: -24, padding: 12 },
  searchControlsMobile: { flexDirection: 'column', alignItems: 'stretch', gap: 10 },
  searchInputMobile: { minHeight: 50 },
  locationSelectMobile: { width: '100%' },
  searchButtonMobile: { width: '100%', marginTop: 0 },
  servicesSection: { paddingHorizontal: 16, marginTop: 28 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headingAccent: { width: 4, height: 42, borderRadius: 2, backgroundColor: '#C9942E', marginRight: 10 },
  headingCopy: { flex: 1 },
  sectionTitle: { fontSize: 19, lineHeight: 24, fontWeight: '800', color: '#1F2A24', fontFamily: 'Cairo' },
  sectionSubtitle: { fontSize: 12, lineHeight: 18, color: '#5F6B64', marginTop: 3, fontFamily: 'Cairo' },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  serviceCard: { width: '48.4%', minHeight: 94, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAF8F1', borderRadius: 12, borderWidth: 1, borderColor: '#EAE4D3', padding: 12, shadowColor: '#1F2A24', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 7, elevation: 1 },
  serviceCardDesktop: { width: '23.5%' },
  serviceIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginBottom: 0 },
  serviceCopy: { flex: 1 },
  serviceTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 },
  serviceTitle: { fontSize: 14, lineHeight: 20, fontWeight: '800', color: '#1F2A24', fontFamily: 'Cairo' },
  serviceDescription: { fontSize: 11, lineHeight: 16, color: '#5F6B64', marginTop: 3, fontFamily: 'Cairo' },
  comingSoonPill: { alignSelf: 'flex-start', marginTop: 9, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full, backgroundColor: '#F1F5F9' },
  comingSoonText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  section: { paddingHorizontal: 16, marginTop: 34 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10 },
  sectionTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sectionTitleAccent: { width: 4, height: 30, borderRadius: 2, backgroundColor: '#C9942E' },
  sectionTitleLarge: { fontSize: 24, lineHeight: 32, fontWeight: '800', color: '#1F2A24', fontFamily: 'Cairo' },
  viewAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 13, color: '#1B5E45', fontWeight: '700', fontFamily: 'Cairo' },
  landGrid: { gap: 14 },
  landColumn: { justifyContent: 'space-between', gap: 14 },
  landCardWrap: { marginBottom: 14 },
  landCardOne: { width: '100%' },
  landCardTwo: { width: '48.5%' },
  landCardThree: { width: '32%' },
  landCard: { width: '100%', padding: 0, overflow: 'hidden', borderRadius: 12, backgroundColor: '#FFFFFF' },
  landImageWrap: { width: '100%', aspectRatio: 1.6, position: 'relative' },
  landImage: { width: '100%', height: '100%' },
  landBadge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
  landBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', fontFamily: 'Cairo' },
  landInfo: { padding: 14 },
  landHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  landName: { fontSize: 16, fontWeight: '800', color: '#1F2A24', flex: 1, fontFamily: 'Cairo' },
  landDetailsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 9 },
  landDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  landMetaText: { fontSize: 12, color: '#5F6B64', fontFamily: 'Cairo' },
  landFeature: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  landFeatureText: { fontSize: 12, color: '#5F6B64', fontFamily: 'Cairo' },
  landDetailsButton: { minHeight: 40, borderWidth: 1, borderColor: '#1B5E45', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 13 },
  landDetailsButtonText: { color: '#1B5E45', fontSize: 13, fontWeight: '800', fontFamily: 'Cairo' },
  skeletonCard: { width: '32%', borderRadius: 12, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  skeletonCardMobile: { width: '100%' },
  skeletonBlock: { backgroundColor: '#E8E9E2', borderRadius: 5 },
  skeletonImage: { width: '100%', aspectRatio: 1.6, borderRadius: 0 },
  skeletonBody: { padding: 14, gap: 10 },
  skeletonLineLarge: { height: 18, width: '75%' },
  skeletonLine: { height: 12, width: '90%' },
  skeletonLineShort: { height: 12, width: '45%' },
  emptyLands: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EAE4D3', padding: 28 },
  emptyLandsTitle: { color: '#5F6B64', fontSize: 15, lineHeight: 24, textAlign: 'center', marginTop: 10, fontFamily: 'Cairo' },
  emptyLandsButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1B5E45', borderRadius: 8, paddingHorizontal: 16, minHeight: 42, marginTop: 16 },
  emptyLandsButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', fontFamily: 'Cairo' },
  nearbyServicesSection: { backgroundColor: '#F1F6F1', marginTop: 30, paddingHorizontal: 16, paddingVertical: 28 },
  adGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14 },
  bannerRail: { marginTop: 18 },
  bannerTrack: { paddingHorizontal: 16, gap: 12 },
  bannerSlide: { height: 200, borderRadius: 16, overflow: 'hidden', justifyContent: 'flex-end' },
  bannerImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  bannerCopy: { padding: 20, alignItems: 'flex-end' },
  bannerTitle: { color: '#FFFFFF', fontSize: 22, lineHeight: 30, fontWeight: '800', fontFamily: 'Cairo', textAlign: 'right' },
  bannerSubtitle: { color: '#E8F1EC', fontSize: 14, lineHeight: 22, marginTop: 4, fontFamily: 'Cairo', textAlign: 'right' },
  guestBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 16, marginTop: 18, backgroundColor: Colors.primary.bg, borderWidth: 1, borderColor: Colors.primary.border, borderRadius: radius.lg, padding: 14 },
  guestBannerCopy: { flex: 1 },
  guestBannerTitle: { fontSize: 15, fontWeight: '800', color: Colors.primary.dark },
  guestBannerText: { fontSize: 12, lineHeight: 18, color: Colors.primary.text, marginTop: 4 },
  guestBannerActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  guestBannerPrimaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary.main, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm },
  guestBannerPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  guestBannerSecondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.primary.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm },
  guestBannerSecondaryText: { color: Colors.primary.main, fontSize: 13, fontWeight: '700' },
  guestBannerClose: { padding: 2, marginTop: 2 },
});
