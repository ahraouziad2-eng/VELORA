import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, ScrollView, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Megaphone, Plus, X, Search, MapPin, Wallet, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase, STORAGE_BUCKETS } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Select } from '@/components/ui/Select';
import { WILAYAS } from '@/constants/wilayas';
import { PageHero } from '@/components/PageHero';
import { PAGE_HERO_CONFIG } from '@/constants/pageHero';
import { SafeImage } from '@/components/SafeImage';
import { Avatar } from '@/components/Avatar';
import { adDetailPath } from '@/lib/detailPaths';
import { FALLBACK_IMAGE } from '@/src/data/demoImages';
import { ContactFields } from '@/components/ContactFields';
import { ContactDraft, ContactErrors, validateContact, hasContactErrors, initialContactDraft, unsavedPhoneFor, formatLocalPhone } from '@/lib/phone';

type AdCategory = 'EQUIPMENT' | 'SEEDS' | 'FERTILIZER' | 'SERVICES' | 'ANIMALS' | 'OTHER';
type AdStatus = 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';

interface AdRow {
  id: string;
  title: string;
  description: string;
  category: AdCategory;
  price: number | null;
  wilaya: string;
  contact_info: string | null;
  image_url: string | null;
  status: AdStatus;
  poster_id: string;
  created_at: string;
  poster?: { full_name: string | null; avatar_url: string | null }[];
}

const adCategoryOptions: { value: AdCategory }[] = [
  { value: 'EQUIPMENT' },
  { value: 'SEEDS' },
  { value: 'FERTILIZER' },
  { value: 'SERVICES' },
  { value: 'ANIMALS' },
  { value: 'OTHER' },
];

export default function AdsScreen() {
  const { profile, guestMode } = useAuth();
  const { t } = useI18n();
  const { show } = useToast();
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const loadAds = useCallback(async () => {
    try {
      let query = supabase
        .from('advertisements')
        .select('id, title, description, category, price, wilaya, contact_info, image_url, status, poster_id, created_at, poster:profiles!poster_id(full_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

      const { data, error } = await query.limit(50);
      if (!error && data) {
        setAds(data as AdRow[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    loadAds();
  }, [loadAds]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAds();
  }, [loadAds]);

  const getCategoryBadge = (category: AdCategory) => {
    const map: Record<AdCategory, { label: string; variant: 'primary' | 'secondary' | 'accent' | 'info' | 'neutral' }> = {
      EQUIPMENT: { label: t('adCategory.equipment'), variant: 'primary' },
      SEEDS: { label: t('adCategory.seeds'), variant: 'accent' },
      FERTILIZER: { label: t('adCategory.fertilizer'), variant: 'secondary' },
      SERVICES: { label: t('adCategory.services'), variant: 'info' },
      ANIMALS: { label: t('adCategory.animals'), variant: 'neutral' },
      OTHER: { label: t('adCategory.other'), variant: 'neutral' },
    };
    return map[category];
  };

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <PageHero title={t('ads.title')} subtitle="إعلانات المعدات والخدمات والمنتجات الفلاحية" config={PAGE_HERO_CONFIG.ads} />

      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Search size={18} color={Colors.neutral.light} />
          <TextInput
            style={styles.searchText}
            placeholder={t('common.search')}
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
        {!guestMode && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
            <Plus size={22} color={Colors.neutral.white} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={ads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.main]} />}
        ListEmptyComponent={<EmptyState icon={<Megaphone size={48} color={Colors.neutral.border} />} title={t('ads.empty')} />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const badge = getCategoryBadge(item.category);
          const isOwn = item.poster_id === profile?.id;
          return (
            <TouchableOpacity key={item.id} onPress={() => router.push(adDetailPath(item))} activeOpacity={0.85}>
            <Card style={styles.card}>
              <SafeImage
                uri={item.image_url}
                fallback={FALLBACK_IMAGE[item.category === 'SERVICES' ? 'services' : 'equipment']}
                style={styles.cardImage}
              />
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Megaphone size={18} color={Colors.primary.main} />
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  </View>
                  <Badge label={badge.label} variant={badge.variant} />
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <MapPin size={14} color={Colors.neutral.textMuted} />
                    <Text style={styles.metaText}>{item.wilaya}</Text>
                  </View>
                  {item.price != null && (
                    <View style={styles.metaItem}>
                      <Wallet size={14} color={Colors.neutral.textMuted} />
                      <Text style={styles.metaText}>{item.price} {t('ads.currency')}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardFooter}>
                  <View style={styles.publisherRow}>
                    <Avatar name={item.poster?.[0]?.full_name} uri={item.poster?.[0]?.avatar_url} size={22} />
                    <Text style={styles.publisherName} numberOfLines={1}>{item.poster?.[0]?.full_name || '---'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString('ar-DZ')}</Text>
                    {isOwn && item.status === 'PENDING_REVIEW' && (
                      <Badge label={t('status.pending')} variant="warning" />
                    )}
                  </View>
                </View>
              </View>
            </Card>
            </TouchableOpacity>
          );
        }}
      />

      <CreateAdModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadAds(); }} t={t} show={show} />
    </View>
  );
}

function CreateAdModal({ visible, onClose, onCreated, t, show }: { visible: boolean; onClose: () => void; onCreated: () => void; t: (k: string) => string; show: (msg: string, type: 'success' | 'error') => void }) {
  const { profile, user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [contact, setContact] = useState<ContactDraft>(() => initialContactDraft(profile));
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle(''); setDescription(''); setCategory(''); setPrice(''); setWilaya(''); setContact(initialContactDraft(profile)); setContactErrors({}); setImageUri(null);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageUri || !user) return null;
    const ext = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
    const path = `${user.id}/ad_${Date.now()}.${ext}`;
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.AD_IMAGES)
      .upload(path, blob, { upsert: true });
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.AD_IMAGES)
      .getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!title || !description || !category || !wilaya) {
      show(t('auth.fillAllFields'), 'error');
      return;
    }
    const contactCheck = validateContact(contact);
    setContactErrors(contactCheck.errors);
    if (hasContactErrors(contactCheck.errors)) return;
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageUri) {
        imageUrl = await uploadImage();
      }
      const { error } = await supabase.from('advertisements').insert({
        poster_id: profile?.id,
        title,
        description,
        category,
        price: price ? parseFloat(price) : null,
        wilaya,
        ...contactCheck.values,
        image_url: imageUrl,
        status: 'PENDING_REVIEW',
      });
      if (error) throw error;
      const newPhone = unsavedPhoneFor(contact, profile?.phone);
      if (contact.saveToAccount && newPhone && profile?.id) {
        const { error: saveError } = await supabase.from('profiles').update({ phone: formatLocalPhone(newPhone) }).eq('id', profile.id);
        if (saveError) show('تم نشر الإعلان لكن تعذر حفظ الرقم في حسابك', 'error');
      }
      show(t('ads.postSuccess'), 'success');
      reset();
      onCreated();
    } catch (err) {
      const message = (err as { message?: string })?.message ?? '';
      show(message.includes('contact_info_required') ? 'أدخل رقم هاتف أو رقم واتساب على الأقل' : t('common.error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('ads.postAd')}</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color={Colors.neutral.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <TextInput style={styles.input} placeholder={t('ads.adTitle')} placeholderTextColor={Colors.neutral.light} value={title} onChangeText={setTitle} />
            <TextInput style={[styles.input, styles.textArea]} placeholder={t('ads.adDescription')} placeholderTextColor={Colors.neutral.light} value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" />
            <Select label={t('ads.category')} value={category} options={adCategoryOptions.map((o) => ({ label: t(`adCategory.${o.value.toLowerCase()}`), value: o.value }))} onSelect={setCategory} placeholder={t('common.all')} />
            <TextInput style={styles.input} placeholder={t('ads.price')} placeholderTextColor={Colors.neutral.light} value={price} onChangeText={setPrice} keyboardType="numeric" />
            <Select label={t('land.wilaya')} value={wilaya} options={WILAYAS.map((w) => ({ label: `${w.nameAr} (${w.code})`, value: w.nameAr }))} onSelect={setWilaya} placeholder={t('auth.selectWilaya')} />
            <ContactFields
              draft={contact}
              errors={contactErrors}
              onChange={(patch) => setContact((prev) => ({ ...prev, ...patch }))}
              showSaveOption={unsavedPhoneFor(contact, profile?.phone) !== null}
            />
            <TouchableOpacity onPress={pickImage} style={styles.imagePickerBtn}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Camera size={24} color={Colors.neutral.light} />
                  <Text style={styles.imagePickerText}>{t('ads.addImage') || 'إضافة صورة'}</Text>
                </View>
              )}
            </TouchableOpacity>
            {imageUri && (
              <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeImageBtn}>
                <X size={16} color={Colors.error.main} />
                <Text style={styles.removeImageText}>{t('common.cancel') || 'إزالة'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.submitBtnText}>{submitting ? t('common.loading') : t('ads.submit')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.primary.dark },
  backBtn: { padding: 4 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.neutral.white, flex: 1, fontFamily: 'System' },
  searchBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: Colors.neutral.white, borderBottomWidth: 1, borderBottomColor: Colors.neutral.borderLight },
  searchInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.neutral.surface, borderRadius: radius.md, paddingHorizontal: 12, gap: 8, height: 44 },
  searchText: { flex: 1, fontSize: 15, color: Colors.neutral.text, fontFamily: 'System' },
  addBtn: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: Colors.primary.main, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  card: { padding: 0, overflow: 'hidden' },
  cardImage: { width: '100%', height: 160 },
  cardBody: { padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.neutral.text, flex: 1, fontFamily: 'System' },
  cardDesc: { fontSize: 14, color: Colors.neutral.textLight, lineHeight: 20, fontFamily: 'System' },
  cardMeta: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: Colors.neutral.textMuted, fontFamily: 'System' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.neutral.borderLight, paddingTop: 8 },
  dateText: { fontSize: 12, color: Colors.neutral.light, fontFamily: 'System' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { backgroundColor: Colors.neutral.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.neutral.text, fontFamily: 'System' },
  input: { backgroundColor: Colors.neutral.surface, borderWidth: 1.5, borderColor: Colors.neutral.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.neutral.text, marginBottom: 12, fontFamily: 'System' },
  textArea: { minHeight: 80, textAlignVertical: 'top' as any },
  submitBtn: { backgroundColor: Colors.primary.main, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: Colors.neutral.white, fontSize: 16, fontWeight: '700', fontFamily: 'System' },
  publisherRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  publisherName: { fontSize: 12, color: Colors.neutral.textMuted, fontFamily: 'System', flex: 1 },
  imagePickerBtn: { marginBottom: 12 },
  imagePreview: { width: '100%', height: 140, borderRadius: radius.md },
  imagePickerPlaceholder: { height: 100, borderWidth: 1.5, borderColor: Colors.neutral.border, borderStyle: 'dashed', borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePickerText: { fontSize: 14, color: Colors.neutral.light, fontFamily: 'System' },
  removeImageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  removeImageText: { fontSize: 13, color: Colors.error.main, fontFamily: 'System' },
});
