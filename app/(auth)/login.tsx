import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/Logo';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginScreen() {
  const { t } = useI18n();
  const { refreshProfile } = useAuth();
  const { show } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    if (!email || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }
    if (!isValidEmail(email)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        const msg = signInError.message.toLowerCase();
        if (msg.includes('not confirmed') || msg.includes('email not confirmed')) {
          setError(t('auth.confirmationError'));
        } else if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('wrong')) {
          setError(t('auth.invalidCredentials'));
        } else if (msg.includes('rate') || msg.includes('limit') || msg.includes('too many')) {
          setError(t('auth.genericError'));
        } else {
          setError(t('auth.invalidCredentials'));
        }
        return;
      }

      if (!signInData.session) {
        setError(t('auth.loginFailed'));
        return;
      }

      await refreshProfile();
      show(t('auth.welcomeMessage'), 'success');
      router.replace('/(tabs)');
    } catch {
      setError(t('auth.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <LinearGradient colors={[Colors.primary.bg, Colors.neutral.white]} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.3 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Logo size="md" />
            <Text style={styles.welcome}>{t('auth.welcomeBack')}</Text>
            <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
          </View>

          <View style={styles.form}>
            <Input
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              keyboardType="email-address"
              rightIcon={<Mail size={20} color={Colors.neutral.light} />}
            />
            <Input
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color={Colors.neutral.light} /> : <Eye size={20} color={Colors.neutral.light} />}
                </TouchableOpacity>
              }
            />
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotLink}>
              <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button title={t('auth.signIn')} onPress={handleLogin} loading={loading} fullWidth size="lg" />

            <TouchableOpacity onPress={() => router.push('/(auth)/welcome')} style={styles.guestLink}>
              <Text style={styles.guestLinkText}>{t('auth.continueAsGuestShort')}</Text>
              <ArrowRight size={16} color={Colors.primary.main} />
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.link}>{t('auth.signUp')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 36 },
  welcome: { fontSize: 26, fontWeight: '800', color: Colors.primary.dark, marginTop: 20, fontFamily: 'System' },
  subtitle: { fontSize: 13, color: Colors.neutral.textMuted, marginTop: 8, textAlign: 'center', fontFamily: 'System', paddingHorizontal: 20 },
  form: { backgroundColor: Colors.neutral.white, borderRadius: radius.xl, padding: 24, paddingBottom: 32, marginBottom: 40 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotText: { fontSize: 14, color: Colors.primary.main, fontWeight: '500', fontFamily: 'System' },
  error: { color: Colors.error.main, fontSize: 14, marginBottom: 12, textAlign: 'center', fontFamily: 'System' },
  guestLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingVertical: 8 },
  guestLinkText: { fontSize: 14, color: Colors.primary.main, fontWeight: '500', fontFamily: 'System' },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 },
  footerText: { fontSize: 14, color: Colors.neutral.textMuted, fontFamily: 'System' },
  link: { fontSize: 14, color: Colors.primary.main, fontWeight: '600', fontFamily: 'System' },
});
