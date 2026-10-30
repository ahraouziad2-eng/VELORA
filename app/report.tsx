import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight, Flag } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export default function ReportScreen() {
  const { targetType, targetId } = useLocalSearchParams<{ targetType: string; targetId: string }>();
  const { user } = useAuth();
  const { t } = useI18n();
  const { show } = useToast();
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reportType || !description || !targetId) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        report_type: reportType,
        target_type: targetType || 'land',
        target_id: targetId,
        description,
        status: 'OPEN',
      });

      if (error) throw error;

      show(t('report.submitted'), 'success');
      router.back();
    } catch {
      show(t('common.error'), 'error');
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
        <View style={styles.headerIcon}><Flag size={22} color={Colors.neutral.white} /></View>
        <Text style={styles.headerTitle}>{t('report.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <Select
          label={t('report.type')}
          value={reportType}
          options={[
            { label: t('reportType.incorrectLand'), value: 'INCORRECT_LAND' },
            { label: t('reportType.suspiciousDoc'), value: 'SUSPICIOUS_DOC' },
            { label: t('reportType.falseInfo'), value: 'FALSE_INFO' },
            { label: t('reportType.suspiciousAccount'), value: 'SUSPICIOUS_ACCOUNT' },
            { label: t('reportType.inappropriateContent'), value: 'INAPPROPRIATE_CONTENT' },
            { label: t('reportType.fraudAttempt'), value: 'FRAUD_ATTEMPT' },
            { label: t('reportType.other'), value: 'OTHER' },
          ]}
          onSelect={setReportType}
          placeholder={t('report.type')}
        />
        <Input label={t('report.description')} value={description} onChangeText={setDescription} placeholder={t('report.description')} multiline numberOfLines={4} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button title={t('report.submit')} onPress={handleSubmit} loading={submitting} fullWidth size="lg" disabled={!reportType || !description} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.error.main },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.neutral.white, flex: 1, fontFamily: 'System' },
  body: { flex: 1, padding: 16 },
  bottomBar: { padding: 16, paddingBottom: 32, backgroundColor: Colors.neutral.white, borderTopWidth: 1, borderTopColor: Colors.neutral.borderLight },
});
