import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Mail, User, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/Logo';

const PASSWORD_MIN_LENGTH = 8;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterScreen() {
  const { t } = useI18n();
  const { refreshProfile } = useAuth();
  const { show } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordMeetsRequirements =
    password.length >= PASSWORD_MIN_LENGTH && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);

  const handleRegister = async () => {
    setError('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError(t('auth.fillAllFields'));
      return;
    }
    if (!isValidEmail(email)) {
      setError(t('auth.invalidEmail'));
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    if (!acceptTerms || !acceptPrivacy) {
      setError(t('auth.acceptAllTerms'));
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
          setError(t('auth.alreadyRegistered'));
        } else if (msg.includes('rate') || msg.includes('limit') || msg.includes('too many')) {
          setError(t('auth.genericError'));
        } else if (msg.includes('password')) {
          setError(t('auth.passwordTooShort'));
        } else {
          setError(t('auth.genericError'));
        }
        return;
      }
      if (!data.user) {
        setError(t('auth.genericError'));
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';

      try {
        await fetch(`${supabaseUrl}/functions/v1/auto-confirm-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, userId: data.user.id }),
        });
      } catch {
        // Non-fatal — sign-in may still work if confirmation is off.
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !signInData.session) {
        if (signInError) {
          const msg = signInError.message.toLowerCase();
          if (msg.includes('not confirmed') || msg.includes('email not confirmed')) {
            setError(t('auth.confirmationError'));
          } else {
            setError(t('auth.loginFailed'));
          }
        } else {
          setError(t('auth.loginFailed'));
        }
        return;
      }

      await refreshProfile();

      fetch(`${supabaseUrl}/functions/v1/welcome-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, userId: data.user.id }),
      }).catch(() => {});

      show(t('auth.welcomeMessage'), 'success');
      router.replace('/(tabs)');
    } catch {
      setError(t('auth.genericError'));
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
            <Text style={styles.title}>{t('auth.register')}</Text>
            <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
          </View>

          <View style={styles.form}>
            <Input label={t('auth.fullName')} value={fullName} onChangeText={setFullName} placeholder="الاسم واللقب" rightIcon={<User size={20} color={Colors.neutral.light} />} />
            <Input label={t('auth.email')} value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" rightIcon={<Mail size={20} color={Colors.neutral.light} />} />
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
            <Input
              label={t('auth.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              secureTextEntry={!showConfirm}
              error={confirmPassword && password !== confirmPassword ? t('auth.passwordMismatch') : undefined}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff size={20} color={Colors.neutral.light} /> : <Eye size={20} color={Colors.neutral.light} />}
                </TouchableOpacity>
              }
            />

            {password.length > 0 && (
              <View style={styles.passwordHint}>
                <View style={[styles.checkDot, passwordMeetsRequirements ? styles.checkDotMet : null]} />
                <Text style={[styles.passwordHintText, passwordMeetsRequirements ? styles.passwordHintMet : null]}>{t('auth.passwordRequirements')}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.checkboxRow} onPress={() => setAcceptTerms(!acceptTerms)}>
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                {t('auth.acceptTerms')} <Text style={styles.checkboxLink} onPress={() => router.push('/terms')}>{t('auth.termsOfUse')}</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setAcceptPrivacy(!acceptPrivacy)}>
              <View style={[styles.checkbox, acceptPrivacy && styles.checkboxChecked]}>
                {acceptPrivacy && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                {t('auth.acceptPrivacy')} <Text style={styles.checkboxLink} onPress={() => router.push('/privacy')}>{t('auth.privacyPolicy')}</Text>
              </Text>
            </TouchableOpacity>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button title={t('auth.signUp')} onPress={handleRegister} loading={loading} fullWidth size="lg" />

            <TouchableOpacity onPress={() => router.push('/(auth)/welcome')} style={styles.guestLink}>
              <Text style={styles.guestLinkText}>{t('auth.continueAsGuestShort')}</Text>
              <ArrowRight size={16} color={Colors.primary.main} />
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.haveAccount')}</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.link}>{t('auth.signIn')}</Text>
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
  header: { alignItems: 'center', paddingTop: 50, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.primary.dark, marginTop: 16, fontFamily: 'System' },
  subtitle: { fontSize: 13, color: Colors.neutral.textMuted, marginTop: 8, textAlign: 'center', fontFamily: 'System' },
  form: { backgroundColor: Colors.neutral.white, borderRadius: radius.xl, padding: 24, paddingBottom: 32, marginBottom: 40 },
  passwordHint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingHorizontal: 4 },
  checkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.neutral.border },
  checkDotMet: { backgroundColor: Colors.success.main },
  passwordHintText: { fontSize: 12, color: Colors.neutral.textMuted, fontFamily: 'System' },
  passwordHintMet: { color: Colors.success.main },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: Colors.neutral.border, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary.main, borderColor: Colors.primary.main },
  checkmark: { color: Colors.neutral.white, fontSize: 14, fontWeight: '700' },
  checkboxLabel: { flex: 1, fontSize: 14, color: Colors.neutral.textLight, fontFamily: 'System' },
  checkboxLink: { color: Colors.primary.main, fontWeight: '600', textDecorationLine: 'underline' },
  error: { color: Colors.error.main, fontSize: 14, marginBottom: 12, textAlign: 'center', fontFamily: 'System' },
  guestLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingVertical: 8 },
  guestLinkText: { fontSize: 14, color: Colors.primary.main, fontWeight: '500', fontFamily: 'System' },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 },
  footerText: { fontSize: 14, color: Colors.neutral.textMuted, fontFamily: 'System' },
  link: { fontSize: 14, color: Colors.primary.main, fontWeight: '600', fontFamily: 'System' },
});
