import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Globe, Bell, Shield, Lock, Info, LogOut, Trash2, FileText, Heart, X, AlertTriangle, Mail, Scale } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { user, signOut, profile } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleLogout = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  const confirmLogout = useCallback(async () => {
    setShowLogoutModal(false);
    setBusy(true);
    try {
      await signOut();
      show(t('auth.logoutSuccess'), 'success');
      router.replace('/(auth)/login');
    } catch {
      show(t('common.error'), 'error');
      setBusy(false);
    }
  }, [signOut, show, t]);

  const handleChangePassword = async () => {
    if (!user?.email) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      show(t('settings.changePassword'), 'success');
    } catch {
      show(t('common.error'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteAccount = useCallback(async () => {
    setShowDeleteModal(false);
    setBusy(true);
    try {
      const { error: rpcError } = await supabase.rpc('delete_own_account');
      if (rpcError) throw rpcError;
      await signOut();
      try { await AsyncStorage.removeItem('@agriland_onboarding_complete'); } catch {}
      show(t('auth.deleteSuccess'), 'success');
      router.replace('/(auth)/login');
    } catch (err) {
      show(t('auth.deleteFailed'), 'error');
      setBusy(false);
    }
  }, [signOut, show, t]);

  const localeOptions = [
    { label: 'العربية', value: 'ar' },
    { label: 'Français', value: 'fr' },
    { label: 'English', value: 'en' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <Card style={styles.menuCard}>
          {localeOptions.map((opt) => (
            <TouchableOpacity key={opt.value} onPress={() => setLocale(opt.value as 'ar' | 'fr' | 'en')} style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Globe size={20} color={Colors.neutral.main} />
                <Text style={styles.menuLabel}>{opt.label}</Text>
              </View>
              {locale === opt.value && <View style={styles.checkmark} />}
            </TouchableOpacity>
          ))}
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.security')}</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword} disabled={busy}>
            <View style={styles.menuLeft}>
              <Lock size={20} color={Colors.neutral.main} />
              <Text style={styles.menuLabel}>{t('settings.changePassword')}</Text>
            </View>
            {busy ? <ActivityIndicator size="small" color={Colors.primary.main} /> : <ChevronLeft size={18} color={Colors.neutral.light} />}
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/profile/about')}>
            <View style={styles.menuLeft}>
              <Info size={20} color={Colors.neutral.main} />
              <Text style={styles.menuLabel}>{t('settings.about')}</Text>
            </View>
            <ChevronLeft size={18} color={Colors.neutral.light} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/terms')}>
            <View style={styles.menuLeft}>
              <FileText size={20} color={Colors.neutral.main} />
              <Text style={styles.menuLabel}>{t('settings.terms')}</Text>
            </View>
            <ChevronLeft size={18} color={Colors.neutral.light} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/privacy')}>
            <View style={styles.menuLeft}>
              <Shield size={20} color={Colors.neutral.main} />
              <Text style={styles.menuLabel}>{t('settings.privacyPolicy')}</Text>
            </View>
            <ChevronLeft size={18} color={Colors.neutral.light} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/contact')}>
            <View style={styles.menuLeft}>
              <Mail size={20} color={Colors.neutral.main} />
              <Text style={styles.menuLabel}>{t('contact.title')}</Text>
            </View>
            <ChevronLeft size={18} color={Colors.neutral.light} />
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.section}>
        <Card style={styles.menuCard}>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.menuItem}
            disabled={busy}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              {busy ? <ActivityIndicator size="small" color={Colors.error.main} /> : <LogOut size={20} color={Colors.error.main} />}
              <Text style={[styles.menuLabel, { color: Colors.error.main }]}>{t('settings.logout')}</Text>
            </View>
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.section}>
        <Card style={[styles.menuCard, { borderColor: Colors.error[100], borderWidth: 1 }]}>
          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={styles.menuItem}
            disabled={busy}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Trash2 size={20} color={Colors.error.main} />
              <Text style={[styles.menuLabel, { color: Colors.error.main }]}>{t('settings.deleteAccount')}</Text>
            </View>
          </TouchableOpacity>
        </Card>
      </View>

      <Text style={styles.disclaimer}>{t('app.disclaimer')}</Text>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLogoutModal(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalIconWrap}>
              <LogOut size={32} color={Colors.primary.main} />
            </View>
            <Text style={styles.modalTitle}>{t('settings.logout')}</Text>
            <Text style={styles.modalMessage}>{t('settings.logoutConfirm')}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalBtnCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={confirmLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.modalBtnConfirmText}>{t('settings.logout')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowDeleteModal(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={[styles.modalIconWrap, { backgroundColor: Colors.error[50] }]}>
              <AlertTriangle size={32} color={Colors.error.main} />
            </View>
            <Text style={styles.modalTitle}>{t('settings.deleteAccount')}</Text>
            <Text style={styles.modalMessage}>
              {t('settings.deleteConfirm')}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowDeleteModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalBtnCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.error.main }]}
                onPress={confirmDeleteAccount}
                activeOpacity={0.7}
              >
                <Text style={styles.modalBtnConfirmText}>{t('settings.deleteAccount')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg } as any,
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.neutral.white, borderBottomWidth: 1, borderBottomColor: Colors.neutral.borderLight } as any,
  backBtn: { padding: 4 } as any,
  backText: { fontSize: 16, color: Colors.primary.main, fontWeight: '600', fontFamily: 'System' } as any,
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.neutral.text, fontFamily: 'System' } as any,
  section: { paddingHorizontal: 16, marginTop: 24 } as any,
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutral.textLight, marginBottom: 12, fontFamily: 'System' } as any,
  menuCard: { padding: 0, overflow: 'hidden' } as any,
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16, minHeight: 56 } as any,
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 } as any,
  menuLabel: { fontSize: 15, color: Colors.neutral.text, fontFamily: 'System' } as any,
  divider: { height: 1, backgroundColor: Colors.neutral.borderLight } as any,
  checkmark: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary.main, alignItems: 'center', justifyContent: 'center' } as any,
  disclaimer: { fontSize: 11, color: Colors.neutral.textMuted, textAlign: 'center', paddingHorizontal: 24, paddingVertical: 24, lineHeight: 18, fontFamily: 'System' } as any,

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 } as any,
  modalContent: { backgroundColor: Colors.neutral.white, borderRadius: 20, padding: 28, width: '100%', maxWidth: 360, alignItems: 'center' } as any,
  modalIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center', marginBottom: 16 } as any,
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.neutral.text, marginBottom: 8, fontFamily: 'System', textAlign: 'center' } as any,
  modalMessage: { fontSize: 14, color: Colors.neutral.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24, fontFamily: 'System' } as any,
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' } as any,
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', minHeight: 48 } as any,
  modalBtnCancel: { backgroundColor: Colors.neutral[100] } as any,
  modalBtnCancelText: { fontSize: 16, fontWeight: '600', color: Colors.neutral.text, fontFamily: 'System' } as any,
  modalBtnConfirm: { backgroundColor: Colors.primary.main } as any,
  modalBtnConfirmText: { fontSize: 16, fontWeight: '600', color: Colors.neutral.white, fontFamily: 'System' } as any,
});
