import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Camera, User as UserIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase, STORAGE_BUCKETS } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { WILAYAS } from '@/constants/wilayas';

export default function EditProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useI18n();
  const { show } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [wilaya, setWilaya] = useState(profile?.wilaya || '');
  const [commune, setCommune] = useState(profile?.commune || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [experience, setExperience] = useState(profile?.experience || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const communeOptions = wilaya
    ? WILAYAS.find((w) => w.nameAr === wilaya)?.communes.map((c) => ({ label: c, value: c })) || []
    : [];

  const handleWilayaSelect = (value: string) => {
    setWilaya(value);
    if (commune) setCommune('');
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = useCallback(async () => {
    if (!user) return;
    if (saving) return;

    if (!fullName.trim()) {
      show(t('profile.nameRequired'), 'error');
      return;
    }

    setSaving(true);

    let avatarUrl = profile?.avatar_url || null;

    try {
      if (avatarUri) {
        const ext = avatarUri.split('.').pop() || 'jpg';
        const path = `${user.id}/avatar_${Date.now()}.${ext}`;
        const response = await fetch(avatarUri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.PROFILE_IMAGES)
          .upload(path, blob, { upsert: true });

        if (uploadError) {
          show(t('profile.photoUploadFailed'), 'error');
          setSaving(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from(STORAGE_BUCKETS.PROFILE_IMAGES)
          .getPublicUrl(path);
        avatarUrl = publicUrl;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          wilaya: wilaya || null,
          commune: commune || null,
          bio: bio.trim() || null,
          experience: experience.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (updateError) {
        show(t('profile.updateFailed'), 'error');
        setSaving(false);
        return;
      }

      await refreshProfile();
      show(t('profile.savedSuccess'), 'success');
      router.back();
    } catch {
      show(t('profile.updateFailed'), 'error');
    } finally {
      setSaving(false);
    }
  }, [user, saving, avatarUri, fullName, phone, wilaya, commune, bio, experience, profile?.avatar_url, refreshProfile, show, t]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.editProfile')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrap}>
          {(avatarUri || profile?.avatar_url) ? (
            <Image source={{ uri: (avatarUri || profile?.avatar_url) as string }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <UserIcon size={40} color={Colors.neutral.white} />
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Camera size={16} color={Colors.neutral.white} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Input label={t('auth.fullName')} value={fullName} onChangeText={setFullName} placeholder={t('auth.fullName')} />
        <Input label={t('profile.phone')} value={phone} onChangeText={setPhone} placeholder="06 XX XX XX XX" keyboardType="phone-pad" />
        <SearchableSelect label={t('auth.wilaya')} value={wilaya} options={WILAYAS.map((w) => ({ label: `${w.nameAr} (${w.code})`, value: w.nameAr }))} onSelect={handleWilayaSelect} placeholder={t('auth.selectWilaya')} />
        <SearchableSelect label={t('auth.commune')} value={commune} options={communeOptions} onSelect={setCommune} placeholder={t('auth.selectCommune')} />
        <Input label={t('profile.bio')} value={bio} onChangeText={setBio} placeholder={t('profile.bio')} multiline numberOfLines={3} />
        <Input label={t('profile.experience')} value={experience} onChangeText={setExperience} placeholder={t('profile.experience')} multiline numberOfLines={3} />

        <Button title={saving ? t('common.loading') : t('profile.save')} onPress={handleSave} loading={saving} fullWidth size="lg" disabled={saving} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.primary.main },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.neutral.white, fontFamily: 'System' },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: Colors.primary.main },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.neutral.surface, alignItems: 'center', justifyContent: 'center' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary.main, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.neutral.white },
  form: { paddingHorizontal: 16, gap: 16 },
});
