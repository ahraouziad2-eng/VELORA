import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, LogIn, UserPlus } from 'lucide-react-native';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

export default function WelcomeScreen() {
  const { enterGuestMode, exitGuestMode } = useAuth();
  const { t } = useI18n();

  const continueAsGuest = () => {
    enterGuestMode();
    router.replace('/(tabs)');
  };

  const openLogin = () => {
    exitGuestMode();
    router.push('/(auth)/login');
  };

  const openRegister = () => {
    exitGuestMode();
    router.push('/(auth)/register');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#14532d', '#15803d', '#22c55e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.background}>
        <View style={styles.glow} />
        <View style={styles.content}>
          <BrandLogo variant="icon" size={110} />
          <Text style={styles.wordmark}>VELORA</Text>
          <Text style={styles.tagline}>One Platform. Endless Possibilities.</Text>
          <Text style={styles.title}>{t('guest.welcomeTitle')}</Text>
          <Text style={styles.subtitle}>{t('guest.welcomeSubtitle')}</Text>
        </View>

        <View style={styles.actions}>
          <Button
            title={t('guest.continueAsGuest')}
            onPress={continueAsGuest}
            fullWidth
            size="lg"
            icon={<ArrowLeft size={20} color="#FFFFFF" />}
            style={styles.guestButton}
          />
          <TouchableOpacity onPress={openLogin} style={styles.secondaryAction} activeOpacity={0.8}>
            <LogIn size={19} color="#FFFFFF" />
            <Text style={styles.secondaryActionText}>{t('guest.signIn')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openRegister} style={styles.secondaryAction} activeOpacity={0.8}>
            <UserPlus size={19} color="#FFFFFF" />
            <Text style={styles.secondaryActionText}>{t('guest.createAccount')}</Text>
          </TouchableOpacity>
          <Text style={styles.note}>{t('guest.browseNote')}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#14532d' },
  background: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 72, paddingBottom: 30, overflow: 'hidden' },
  glow: { position: 'absolute', width: 360, height: 360, borderRadius: 180, backgroundColor: 'rgba(34,197,94,0.2)', top: -120, right: -100 },
  content: { alignItems: 'center', paddingTop: 20 },
  wordmark: { color: '#FFFFFF', fontSize: 23, fontWeight: '800', letterSpacing: 4, marginTop: 18 },
  tagline: { color: '#DCFCE7', fontSize: 13, marginTop: 8, textAlign: 'center' },
  title: { color: '#FFFFFF', fontSize: 29, lineHeight: 36, fontWeight: '800', textAlign: 'center', marginTop: 54 },
  subtitle: { color: '#DCFCE7', fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 12, maxWidth: 330 },
  actions: { gap: 12 },
  guestButton: { backgroundColor: '#15803d', borderColor: '#15803d' },
  secondaryAction: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.38)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  secondaryActionText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  note: { color: '#BBF7D0', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 4 },
});
