import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react-native';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/Logo';

const PASSWORD_MIN_LENGTH = 8;

export default function ResetPasswordScreen() {
  const { t } = useI18n();
  const { show } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleUpdate = async () => {
    setError('');
    if (!password || !confirmPassword) {
      setError(t('auth.fillAllFields'));
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

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        const msg = updateError.message.toLowerCase();
        if (msg.includes('same') || msg.includes('weak')) {
          setError(t('auth.passwordUpdateFailed'));
        } else if (msg.includes('expired') || msg.includes('session')) {
          setError(t('auth.resetLinkExpired'));
        } else {
          setError(t('auth.passwordUpdateFailed'));
        }
        return;
      }
      setSuccess(true);
      show(t('auth.passwordUpdated'), 'success');
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
            <Text style={styles.title}>{t('auth.updatePassword')}</Text>
          </View>
          <View style={styles.form}>
            {success ? (
              <View style={styles.successContainer}>
                <View style={styles.successIconWrap}>
                  <CheckCircle2 size={36} color={Colors.success.main} />
                </View>
                <Text style={styles.successTitle}>{t('auth.passwordUpdated')}</Text>
                <Button title={t('auth.signIn')} onPress={() => router.replace('/(auth)/login')} fullWidth size="lg" />
              </View>
            ) : (
              <>
                <Text style={styles.description}>{t('auth.passwordRequirements')}</Text>
                <Input
                  label={t('auth.newPassword')}
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
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button
                  title={t('auth.updatePassword')}
                  onPress={handleUpdate}
                  loading={loading}
                  disabled={!ready}
                  fullWidth
                  size="lg"
                />
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
  description: { fontSize: 13, color: Colors.neutral.textMuted, lineHeight: 20, textAlign: 'center', marginBottom: 20, fontFamily: 'System' },
  error: { color: Colors.error.main, fontSize: 14, marginBottom: 12, textAlign: 'center', fontFamily: 'System' },
  successContainer: { alignItems: 'center', gap: 16 },
  successIconWrap: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.success[50], alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successTitle: { fontSize: 18, fontWeight: '700', color: Colors.success.main, textAlign: 'center', marginBottom: 16, fontFamily: 'System' },
});
