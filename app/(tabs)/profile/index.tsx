import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, FileText, Heart, FileSignature, MapPin, Bell, Globe, Shield, LogOut, Trash2, ChevronLeft, BadgeCheck, User as UserIcon, Scale, Info, Edit3, AlertTriangle, LogIn, UserPlus } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { AccountRequiredModal } from '@/components/ui/AccountRequiredModal';
import { Avatar } from '@/components/Avatar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { profile, roles, signOut, loading, guestMode, exitGuestMode } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { show } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (loading) return <LoadingState />;

  if (guestMode) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.guestContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.guestCard}>
          <View style={styles.guestIconWrap}>
            <UserIcon size={38} color="#2563EB" />
          </View>
          <Text style={styles.guestTitle}>{t('guest.requiredTitle')}</Text>
          <Text style={styles.guestMessage}>{t('guest.requiredMessage')}</Text>
          <View style={styles.guestActions}>
            <TouchableOpacity
              style={styles.guestPrimaryBtn}
              onPress={() => { exitGuestMode(); router.push('/(auth)/login'); }}
              activeOpacity={0.8}
            >
              <LogIn size={18} color="#FFFFFF" />
              <Text style={styles.guestPrimaryText}>{t('guest.signIn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.guestSecondaryBtn}
              onPress={() => { exitGuestMode(); router.push('/(auth)/register'); }}
              activeOpacity={0.8}
            >
              <UserPlus size={18} color="#2563EB" />
              <Text style={styles.guestSecondaryText}>{t('guest.createAccount')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');

  const menuItems = [
    { icon: <FileText size={20} color={Colors.primary.main} />, label: t('profile.myLands'), route: '/(tabs)/profile/my-lands' as const },
    { icon: <Heart size={20} color={Colors.error.main} />, label: t('profile.favorites'), route: '/(tabs)/profile/favorites' as const },
    { icon: <FileSignature size={20} color={Colors.accent.main} />, label: t('profile.contracts'), route: '/(tabs)/profile/contracts' as const },
    { icon: <FileText size={20} color={Colors.warning.main} />, label: t('profile.documents'), route: '/(tabs)/profile/documents' as const },
    { icon: <Scale size={20} color={Colors.secondary.main} />, label: t('legal.title'), route: '/legal/request' as const },
  ];

  const settingsItems = [
    { icon: <Globe size={20} color={Colors.neutral.main} />, label: t('settings.language'), action: () => {
      if (locale === 'ar') setLocale('fr');
      else if (locale === 'fr') setLocale('en');
      else setLocale('ar');
    } },
    { icon: <Bell size={20} color={Colors.neutral.main} />, label: t('settings.notifications'), route: '/(tabs)/notifications' as const },
    { icon: <Shield size={20} color={Colors.neutral.main} />, label: t('settings.security'), route: '/(tabs)/profile/settings' as const },
    { icon: <Info size={20} color={Colors.neutral.main} />, label: t('settings.about'), route: '/(tabs)/profile/about' as const },
  ];

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

  const handleDeleteAccount = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteAccount = useCallback(async () => {
    setShowDeleteModal(false);
    setDeleting(true);
    setBusy(true);
    try {
      const { error: rpcError } = await supabase.rpc('delete_own_account');
      if (rpcError) throw rpcError;
      await signOut();
      try { await AsyncStorage.removeItem('@agriland_onboarding_complete'); } catch {}
      show(t('auth.deleteSuccess'), 'success');
      router.replace('/(auth)/login');
    } catch {
      show(t('auth.deleteFailed'), 'error');
      setDeleting(false);
      setBusy(false);
    }
  }, [signOut, show, t]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[Colors.primary.gradientStart, Colors.primary.gradientEnd]} style={styles.header}>
        <View pointerEvents="none" style={styles.profilePattern} />
        <View style={styles.avatarContainer}>
          <View style={styles.avatarRing}>
            <Avatar name={profile?.full_name} uri={profile?.avatar_url} size={80} />
          </View>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'مستخدم'}</Text>
        <Text style={styles.email}>{profile?.wilaya || ''} {profile?.commune ? `- ${profile.commune}` : ''}</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile/edit')} style={styles.editBtn}>
          <Edit3 size={16} color={Colors.neutral.white} />
          <Text style={styles.editBtnText}>{t('profile.editProfile')}</Text>
        </TouchableOpacity>
        <View style={styles.rolesRow}>
          {roles.map((role) => (
            <Badge key={role} label={t(`role.${role === 'SUPER_ADMIN' ? 'superAdmin' : role === 'LAND_OWNER' ? 'landOwner' : role === 'LEGAL_ADVISOR' ? 'legalAdvisor' : role.toLowerCase()}`)} variant="primary" />
          ))}
          {profile?.is_verified && <Badge label={t('land.verified')} variant="success" />}
        </View>
      </LinearGradient>

      {isAdmin && (
        <View style={styles.section}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile/admin')} activeOpacity={0.85}>
            <Card style={styles.adminCard}>
              <View style={styles.adminLeft}>
                <Shield size={24} color={Colors.primary.main} />
                <Text style={styles.adminText}>{t('admin.title')}</Text>
              </View>
              <ChevronLeft size={20} color={Colors.primary.main} />
            </Card>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.title')}</Text>
        <Card style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} onPress={() => router.push(item.route)} style={styles.menuItem}>
              <View style={styles.menuLeft}>
                {item.icon}
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <ChevronLeft size={18} color={Colors.neutral.light} />
            </TouchableOpacity>
          ))}
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.title')}</Text>
        <Card style={styles.menuCard}>
          {settingsItems.map((item, i) => (
            <TouchableOpacity key={i} onPress={item.action || (() => router.push(item.route!))} style={styles.menuItem}>
              <View style={styles.menuLeft}>
                {item.icon}
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <ChevronLeft size={18} color={Colors.neutral.light} />
            </TouchableOpacity>
          ))}
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
              {busy && !deleting ? <ActivityIndicator size="small" color={Colors.error.main} /> : <LogOut size={20} color={Colors.error.main} />}
              <Text style={[styles.menuLabel, { color: Colors.error.main }]}>{t('settings.logout')}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={styles.menuItem}
            disabled={busy}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              {deleting ? <ActivityIndicator size="small" color={Colors.error.main} /> : <Trash2 size={20} color={Colors.error.main} />}
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
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { position: 'relative', paddingTop: 50, paddingBottom: 24, alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  profilePattern: { ...StyleSheet.absoluteFillObject, opacity: 0.18, borderWidth: 28, borderColor: 'rgba(255,255,255,0.08)' },
  avatarContainer: { marginBottom: 12 },
  avatarRing: { alignSelf: 'flex-start', borderRadius: 46, borderWidth: 3, borderColor: Colors.neutral.white, overflow: 'hidden' },
  name: { fontSize: 22, fontWeight: '800', color: Colors.neutral.white, fontFamily: 'System' },
  email: { fontSize: 14, color: Colors.neutral.white, opacity: 0.9, marginTop: 4, fontFamily: 'System' },
  rolesRow: { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  editBtnText: { fontSize: 14, color: Colors.neutral.white, fontWeight: '600', fontFamily: 'System' },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.neutral.text, marginBottom: 12, fontFamily: 'System' },
  adminCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  adminLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  adminText: { fontSize: 16, fontWeight: '700', color: Colors.primary.main, fontFamily: 'System' },
  menuCard: { padding: 0, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, minHeight: 52 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15, color: Colors.neutral.text, fontFamily: 'System' },
  divider: { height: 1, backgroundColor: Colors.neutral.borderLight },
  disclaimer: { fontSize: 11, color: Colors.neutral.textMuted, textAlign: 'center', paddingHorizontal: 24, paddingVertical: 24, lineHeight: 18, fontFamily: 'System' },

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

  guestContainer: { padding: 24, alignItems: 'center', justifyContent: 'center', flexGrow: 1 } as any,
  guestCard: { width: '100%', maxWidth: 380, backgroundColor: Colors.neutral.white, borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: Colors.neutral.borderLight } as any,
  guestIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 18 } as any,
  guestTitle: { fontSize: 21, fontWeight: '800', color: '#0F172A', textAlign: 'center' } as any,
  guestMessage: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginTop: 10, marginBottom: 22 } as any,
  guestActions: { width: '100%', gap: 10 } as any,
  guestPrimaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50, borderRadius: radius.md, backgroundColor: '#2563EB' } as any,
  guestPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' } as any,
  guestSecondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50, borderRadius: radius.md, backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#DDD6FE' } as any,
  guestSecondaryText: { color: '#6D28D9', fontSize: 16, fontWeight: '700' } as any,
});
