import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Mail, ArrowRight } from 'lucide-react-native';
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

export default function ForgotPasswordScreen() {
  const { t } = useI18n();
  const { show } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    setError('');
    if (!email) {
      setError(t('auth.fillAllFields'));
      return;
    }
    if (!isValidEmail(email)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/auth/reset-password`,
      });
      if (resetError) {
        setError(t('auth.genericError'));
        return;
      }
      setSent(true);
      show(t('auth.resetEmailSent'), 'success');
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
            <Text style={styles.title}>{t('auth.resetPassword')}</Text>
          </View>
          <View style={styles.form}>
            {sent ? (
              <View style={styles.sentContainer}>
                <View style={styles.sentIconWrap}>
                  <Mail size={32} color={Colors.success.main} />
                </View>
                <Text style={styles.sentTitle}>{t('auth.resetEmailSent')}</Text>
                <Text style={styles.sentDesc}>{t('auth.resetEmailDesc')}</Text>
                <Button title={t('auth.backToLogin')} onPress={() => router.push('/(auth)/login')} fullWidth size="lg" />
              </View>
            ) : (
              <>
                <Text style={styles.description}>{t('auth.resetEmailDesc')}</Text>
                <Input
                  label={t('auth.email')}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                  rightIcon={<Mail size={20} color={Colors.neutral.light} />}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button title={t('auth.sendResetLink')} onPress={handleReset} loading={loading} fullWidth size="lg" />
                <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.backLink}>
                  <ArrowRight size={16} color={Colors.primary.main} />
                  <Text style={styles.backLinkText}>{t('auth.backToLogin')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.primary.dark, marginTop: 16, fontFamily: 'System' },
  form: { backgroundColor: Colors.neutral.white, borderRadius: radius.xl, padding: 24, marginBottom: 40 },
  description: { fontSize: 14, color: Colors.neutral.textMuted, lineHeight: 22, textAlign: 'center', marginBottom: 20, fontFamily: 'System' },
  sentContainer: { alignItems: 'center', gap: 16 },
  sentIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.success[50], alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  sentTitle: { fontSize: 18, fontWeight: '700', color: Colors.success.main, textAlign: 'center', fontFamily: 'System' },
  sentDesc: { fontSize: 14, color: Colors.neutral.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 16, fontFamily: 'System' },
  error: { color: Colors.error.main, fontSize: 14, marginBottom: 12, textAlign: 'center', fontFamily: 'System' },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingVertical: 8 },
  backLinkText: { fontSize: 14, color: Colors.primary.main, fontWeight: '500', fontFamily: 'System' },
});
