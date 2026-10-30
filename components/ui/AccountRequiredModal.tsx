import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LockKeyhole } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

interface AccountRequiredModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function AccountRequiredModal({ visible, onDismiss }: AccountRequiredModalProps) {
  const { exitGuestMode } = useAuth();
  const { t } = useI18n();

  const goTo = (route: '/(auth)/login' | '/(auth)/register') => {
    onDismiss();
    exitGuestMode();
    router.push(route);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <View style={styles.iconWrap}>
            <LockKeyhole size={27} color="#2563EB" />
          </View>
          <Text style={styles.title}>{t('guest.requiredTitle')}</Text>
          <Text style={styles.message}>{t('guest.requiredMessage')}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.action, styles.primaryAction]} onPress={() => goTo('/(auth)/login')} activeOpacity={0.8}>
              <Text style={styles.primaryText}>{t('guest.signIn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.action, styles.secondaryAction]} onPress={() => goTo('/(auth)/register')} activeOpacity={0.8}>
              <Text style={styles.secondaryText}>{t('guest.createAccount')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onDismiss} style={styles.laterAction} activeOpacity={0.8}>
            <Text style={styles.laterText}>{t('guest.notNow')}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(8,27,69,0.58)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, borderRadius: 24, backgroundColor: Colors.neutral.white, padding: 26, alignItems: 'center', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 8 },
  iconWrap: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { color: '#0F172A', fontSize: 21, lineHeight: 28, fontWeight: '800', textAlign: 'center' },
  message: { color: '#64748B', fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 10, marginBottom: 22 },
  actions: { width: '100%', gap: 10 },
  action: { minHeight: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  primaryAction: { backgroundColor: '#2563EB' },
  secondaryAction: { backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#DDD6FE' },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryText: { color: '#6D28D9', fontSize: 16, fontWeight: '700' },
  laterAction: { padding: 12, marginTop: 4 },
  laterText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
});
