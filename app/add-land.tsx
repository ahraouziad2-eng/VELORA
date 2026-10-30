import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, ChevronLeft, Check, MapPin, Camera, FileText, Image as ImageIcon, Upload } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase, STORAGE_BUCKETS } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Card } from '@/components/ui/Card';
import { WILAYAS } from '@/constants/wilayas';
import { AccountRequiredModal } from '@/components/ui/AccountRequiredModal';
import { ContactFields } from '@/components/ContactFields';
import { ContactDraft, ContactErrors, validateContact, hasContactErrors, initialContactDraft, unsavedPhoneFor, formatLocalPhone } from '@/lib/phone';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export default function AddLandScreen() {
  const { user, guestMode, profile } = useAuth();
  const { t } = useI18n();
  const { show } = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showAccountRequired, setShowAccountRequired] = useState(guestMode);

  const [name, setName] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [region, setRegion] = useState('');
  const [area, setArea] = useState('');
  const [landType, setLandType] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [possessionType, setPossessionType] = useState('');
  const [docNature, setDocNature] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [docDate, setDocDate] = useState('');
  const [notes, setNotes] = useState('');
  const [docFileUri, setDocFileUri] = useState('');
  const [docFileName, setDocFileName] = useState('');
  const [offerType, setOfferType] = useState('');
  const [description, setDescription] = useState('');
  const [agriculturalInfo, setAgriculturalInfo] = useState('');
  const [price, setPrice] = useState('');
  const [contact, setContact] = useState<ContactDraft>(() => initialContactDraft(profile));
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});

  const communeOptions = wilaya
    ? WILAYAS.find((w) => w.nameAr === wilaya)?.communes.map((c) => ({ label: c, value: c })) || []
    : [];

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImages([...images, ...result.assets.map((a: { uri: string }) => a.uri)]);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        setDocFileUri(result.assets[0].uri);
        setDocFileName(result.assets[0].name || 'document');
      }
    } catch {
      // silent
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    if (primaryImageIndex >= images.length - 1) setPrimaryImageIndex(0);
  };

  const steps = [
    { num: 1, title: t('addLand.step1') },
    { num: 2, title: t('addLand.step2') },
    { num: 3, title: t('addLand.step3') },
    { num: 4, title: t('addLand.step4') },
    { num: 5, title: t('addLand.step5') },
    { num: 6, title: t('addLand.step6') },
  ];

  const canProceed = () => {
    if (step === 1) return name && wilaya && commune && area && landType;
    if (step === 2) return true;
    if (step === 3) return true;
    if (step === 4) return true;
    if (step === 5) return true;
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    const contactCheck = validateContact(contact);
    setContactErrors(contactCheck.errors);
    if (hasContactErrors(contactCheck.errors)) return;
    setSubmitting(true);
    try {
      const { data: landData, error: landError } = await supabase
        .from('lands')
        .insert({
          owner_id: user.id,
          name,
          wilaya,
          commune,
          region: region || null,
          area: parseFloat(area),
          land_type: landType,
          offer_type: offerType || 'NONE',
          description: description || null,
          agricultural_info: agriculturalInfo || null,
          price: price ? parseFloat(price) : null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          verification_status: 'PENDING_REVIEW',
          is_published: false,
          ...contactCheck.values,
        })
        .select()
        .single();

      if (landError) throw landError;

      const newPhone = unsavedPhoneFor(contact, profile?.phone);
      if (contact.saveToAccount && newPhone) {
        const { error: saveError } = await supabase.from('profiles').update({ phone: formatLocalPhone(newPhone) }).eq('id', user.id);
        if (saveError) show('تمت إضافة الأرض لكن تعذر حفظ الرقم في حسابك', 'error');
      }

      if (images.length > 0 && landData) {
        for (let i = 0; i < images.length; i++) {
          const uri = images[i];
          const ext = uri.split('.').pop() || 'jpg';
          const fileName = `${user.id}/${landData.id}/${Date.now()}_${i}.${ext}`;
          const response = await fetch(uri);
          const blob = await response.blob();
          const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKETS.LAND_IMAGES)
            .upload(fileName, blob);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from(STORAGE_BUCKETS.LAND_IMAGES)
              .getPublicUrl(fileName);

            await supabase.from('land_images').insert({
              land_id: landData.id,
              image_url: publicUrl,
              is_primary: i === primaryImageIndex,
            });
          }
        }
      }

      if (docNature && docNumber && landData) {
        let docUrl: string | null = null;

        if (docFileUri) {
          const docExt = docFileName.split('.').pop() || 'pdf';
          const docPath = `${user.id}/${landData.id}/${Date.now()}_${docNumber}.${docExt}`;
          const docResponse = await fetch(docFileUri);
          const docBlob = await docResponse.blob();
          const { error: docUploadError } = await supabase.storage
            .from(STORAGE_BUCKETS.LAND_DOCUMENTS)
            .upload(docPath, docBlob);

          if (!docUploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from(STORAGE_BUCKETS.LAND_DOCUMENTS)
              .getPublicUrl(docPath);
            docUrl = publicUrl;
          }
        }

        if (docUrl) {
          await supabase.from('land_documents').insert({
            land_id: landData.id,
            doc_type: possessionType || docNature,
            doc_url: docUrl,
            doc_name: `${docNature} - ${docNumber}`,
            verification_status: 'PENDING',
          });
        }
      }

      show(t('addLand.success'), 'success');
      router.replace('/(tabs)/profile/my-lands');
    } catch (err) {
      const message = (err as { message?: string })?.message ?? '';
      show(message.includes('contact_info_required') ? 'أدخل رقم هاتف أو رقم واتساب على الأقل' : t('common.error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronRight size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('addLand.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.stepsBar}>
        {steps.map((s) => (
          <View key={s.num} style={[styles.stepDot, step >= s.num && styles.stepDotActive]}>
            {step > s.num ? (
              <Check size={14} color={Colors.neutral.white} />
            ) : (
              <Text style={[styles.stepNum, step >= s.num && styles.stepNumActive]}>{s.num}</Text>
            )}
          </View>
        ))}
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {step === 1 && (
          <View>
            <Input label={t('addLand.name')} value={name} onChangeText={setName} placeholder="اسم الأرض" />
            <SearchableSelect label={t('land.wilaya')} value={wilaya} options={WILAYAS.map((w) => ({ label: `${w.nameAr} (${w.code})`, value: w.nameAr }))} onSelect={setWilaya} placeholder={t('auth.selectWilaya')} />
            <SearchableSelect label={t('land.commune')} value={commune} options={communeOptions} onSelect={setCommune} placeholder={t('auth.selectCommune')} />
            <Input label={t('land.region')} value={region} onChangeText={setRegion} placeholder={t('land.region')} />
            <Input label={t('land.area') + ' (' + t('land.hectare') + ')'} value={area} onChangeText={setArea} placeholder="0" keyboardType="numeric" />
            <Select
              label={t('land.type')}
              value={landType}
              options={[
                { label: t('landType.agricultural'), value: 'AGRICULTURAL' },
                { label: t('landType.grazing'), value: 'GRAZING' },
                { label: t('landType.arable'), value: 'ARABLE' },
                { label: t('landType.irrigated'), value: 'IRRIGATED' },
                { label: t('landType.greenhouse'), value: 'GREENHOUSE' },
                { label: t('landType.orchard'), value: 'ORCHARD' },
                { label: t('landType.other'), value: 'OTHER' },
              ]}
              onSelect={setLandType}
              placeholder={t('land.type')}
            />
            <Input label={t('land.description')} value={description} onChangeText={setDescription} placeholder={t('land.description')} multiline numberOfLines={3} />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>{t('addLand.selectOnMap')}</Text>
            <View style={styles.mapPlaceholder}>
              <MapPin size={48} color={Colors.primary.muted} />
              <Text style={styles.mapPlaceholderText}>{t('addLand.selectOnMap')}</Text>
            </View>
            <Input label={t('addLand.latitude')} value={latitude} onChangeText={setLatitude} placeholder="36.7538" keyboardType="numeric" />
            <Input label={t('addLand.longitude')} value={longitude} onChangeText={setLongitude} placeholder="3.0588" keyboardType="numeric" />
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>{t('addLand.uploadImages')}</Text>
            <TouchableOpacity onPress={pickImages} style={styles.uploadBtn}>
              <Camera size={24} color={Colors.primary.main} />
              <Text style={styles.uploadBtnText}>{t('addLand.uploadImages')}</Text>
            </TouchableOpacity>
            <View style={styles.imageGrid}>
              {images.map((uri, i) => (
                <View key={i} style={styles.imageItem}>
                  <Image source={{ uri }} style={styles.thumbImage} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                    <Text style={styles.removeBtnText}>X</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, i === primaryImageIndex && styles.primaryBtnActive]}
                    onPress={() => setPrimaryImageIndex(i)}
                  >
                    <Text style={styles.primaryBtnText}>{i === primaryImageIndex ? t('addLand.setPrimary') : ''}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {step === 4 && (
          <View>
            <Select
              label={t('addLand.possessionType')}
              value={possessionType}
              options={[
                { label: 'ملكية خاصة', value: 'PRIVATE_OWNERSHIP' },
                { label: 'إيجار', value: 'LEASE' },
                { label: 'عرف', value: 'CUSTOMARY' },
                { label: 'أخرى', value: 'OTHER' },
              ]}
              onSelect={setPossessionType}
              placeholder={t('addLand.possessionType')}
            />
            <Input label={t('addLand.docNature')} value={docNature} onChangeText={setDocNature} placeholder={t('addLand.docNature')} />
            <Input label={t('addLand.docNumber')} value={docNumber} onChangeText={setDocNumber} placeholder={t('addLand.docNumber')} />
            <Input label={t('addLand.docDate')} value={docDate} onChangeText={setDocDate} placeholder="YYYY-MM-DD" />
            <Text style={styles.stepTitle}>{t('addLand.step4')}</Text>
            <TouchableOpacity onPress={pickDocument} style={styles.uploadBtn}>
              <Upload size={24} color={Colors.primary.main} />
              <Text style={styles.uploadBtnText}>{docFileName || t('addLand.docNature')}</Text>
            </TouchableOpacity>
            <Input label={t('addLand.notes')} value={notes} onChangeText={setNotes} placeholder={t('addLand.notes')} multiline numberOfLines={3} />
          </View>
        )}

        {step === 5 && (
          <View>
            <Select
              label={t('land.offerType')}
              value={offerType}
              options={[
                { label: t('addLand.forRent'), value: 'FOR_RENT' },
                { label: t('addLand.forPartnership'), value: 'FOR_PARTNERSHIP' },
                { label: t('addLand.forInvestment'), value: 'FOR_INVESTMENT' },
              ]}
              onSelect={setOfferType}
              placeholder={t('land.offerType')}
            />
            <Input label={t('land.agriculturalInfo')} value={agriculturalInfo} onChangeText={setAgriculturalInfo} placeholder={t('land.agriculturalInfo')} multiline numberOfLines={3} />
            <Input label={t('explore.price') + ' (DZD)'} value={price} onChangeText={setPrice} placeholder="0" keyboardType="numeric" />
          </View>
        )}

        {step === 6 && (
          <View>
            <Text style={styles.stepTitle}>{t('addLand.review')}</Text>
            <Card style={styles.reviewCard}>
              <View style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('addLand.name')}</Text><Text style={styles.reviewValue}>{name}</Text></View>
              <View style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('land.wilaya')}</Text><Text style={styles.reviewValue}>{wilaya}</Text></View>
              <View style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('land.commune')}</Text><Text style={styles.reviewValue}>{commune}</Text></View>
              <View style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('land.area')}</Text><Text style={styles.reviewValue}>{area} {t('land.hectare')}</Text></View>
              <View style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('land.type')}</Text><Text style={styles.reviewValue}>{landType}</Text></View>
              <View style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('land.offerType')}</Text><Text style={styles.reviewValue}>{offerType || '---'}</Text></View>
              {price ? <View style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('explore.price')}</Text><Text style={styles.reviewValue}>{price} DZD</Text></View> : null}
              <View style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('addLand.step3')}</Text><Text style={styles.reviewValue}>{images.length}</Text></View>
            </Card>
            <ContactFields
              draft={contact}
              errors={contactErrors}
              onChange={(patch) => setContact((prev) => ({ ...prev, ...patch }))}
              showSaveOption={unsavedPhoneFor(contact, profile?.phone) !== null}
            />
            <Text style={styles.pendingMsg}>{t('addLand.pendingReviewMsg')}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar} pointerEvents={guestMode ? 'none' : 'auto'}>
        {step > 1 && (
          <Button title={t('addLand.previous')} onPress={() => setStep(step - 1)} variant="outline" size="md" />
        )}
        {step < 6 ? (
          <Button title={t('addLand.next')} onPress={() => canProceed() && setStep(step + 1)} disabled={!canProceed()} size="md" style={{ flex: 1 }} />
        ) : (
          <Button title={t('addLand.submit')} onPress={handleSubmit} loading={submitting} size="md" style={{ flex: 1 }} />
        )}
      </View>

      <AccountRequiredModal visible={showAccountRequired} onDismiss={() => { setShowAccountRequired(false); router.back(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.primary.main },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.neutral.white, fontFamily: 'System' },
  stepsBar: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: Colors.neutral.white, borderBottomWidth: 1, borderBottomColor: Colors.neutral.borderLight },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.neutral.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.neutral.border },
  stepDotActive: { backgroundColor: Colors.primary.main, borderColor: Colors.primary.main },
  stepNum: { fontSize: 14, fontWeight: '700', color: Colors.neutral.light, fontFamily: 'System' },
  stepNumActive: { color: Colors.neutral.white },
  body: { flex: 1, padding: 16 },
  stepTitle: { fontSize: 18, fontWeight: '700', color: Colors.neutral.text, marginBottom: 12, fontFamily: 'System' },
  mapPlaceholder: { height: 200, backgroundColor: Colors.primary.bg, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  mapPlaceholderText: { fontSize: 14, color: Colors.primary.main, marginTop: 8, fontFamily: 'System' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderWidth: 2, borderColor: Colors.primary.border, borderRadius: radius.md, borderStyle: 'dashed', backgroundColor: Colors.primary.bg, marginBottom: 16 },
  uploadBtnText: { fontSize: 15, fontWeight: '600', color: Colors.primary.main, fontFamily: 'System' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageItem: { width: 100, height: 120, borderRadius: radius.md, overflow: 'hidden', position: 'relative' },
  thumbImage: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: Colors.neutral.white, fontSize: 12, fontWeight: '700' },
  primaryBtn: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 4 },
  primaryBtnActive: { backgroundColor: Colors.primary.main },
  primaryBtnText: { color: Colors.neutral.white, fontSize: 10, textAlign: 'center', fontFamily: 'System' },
  reviewCard: { gap: 8 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.neutral.borderLight },
  reviewLabel: { fontSize: 14, color: Colors.neutral.textMuted, fontFamily: 'System' },
  reviewValue: { fontSize: 14, fontWeight: '600', color: Colors.neutral.text, fontFamily: 'System' },
  pendingMsg: { fontSize: 14, color: Colors.warning.main, textAlign: 'center', marginTop: 16, fontFamily: 'System' },
  bottomBar: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 32, backgroundColor: Colors.neutral.white, borderTopWidth: 1, borderTopColor: Colors.neutral.borderLight },
});
