import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight, TrendingUp, Home, Handshake } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AccountRequiredModal } from '@/components/ui/AccountRequiredModal';

export default function RequestScreen() {
  const { type, landId } = useLocalSearchParams<{ type: string; landId: string }>();
  const { user, guestMode } = useAuth();
  const { t } = useI18n();
  const { show } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showAccountRequired, setShowAccountRequired] = useState(guestMode);

  const [investmentType, setInvestmentType] = useState('');
  const [duration, setDuration] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [budget, setBudget] = useState('');
  const [experience, setExperience] = useState('');
  const [notes, setNotes] = useState('');
  const [proposedTerms, setProposedTerms] = useState('');

  const titles: Record<string, string> = {
    investment: t('land.investmentRequest'),
    rental: t('land.rentalRequest'),
    partnership: t('land.partnershipRequest'),
  };

  const icons: Record<string, React.ReactNode> = {
    investment: <TrendingUp size={24} color={Colors.neutral.white} />,
    rental: <Home size={24} color={Colors.neutral.white} />,
    partnership: <Handshake size={24} color={Colors.neutral.white} />,
  };

  const handleSubmit = async () => {
    if (!user || !landId) return;
    setSubmitting(true);
    try {
      const tableMap: Record<string, string> = {
        investment: 'land_investment_requests',
        rental: 'rental_requests',
        partnership: 'partnership_requests',
      };

      const payload: Record<string, unknown> = {
        land_id: landId,
        requester_id: user.id,
        status: 'PENDING',
      };

      if (type === 'investment') {
        payload.investment_type = investmentType || null;
        payload.duration_months = duration ? parseInt(duration) : null;
        payload.project_description = projectDesc || null;
        payload.budget = budget ? parseFloat(budget) : null;
        payload.experience = experience || null;
        payload.notes = notes || null;
      } else if (type === 'rental') {
        payload.proposed_terms = proposedTerms || null;
        payload.duration_months = duration ? parseInt(duration) : null;
        payload.budget = budget ? parseFloat(budget) : null;
        payload.notes = notes || null;
      } else {
        payload.proposed_terms = proposedTerms || null;
        payload.duration_months = duration ? parseInt(duration) : null;
        payload.notes = notes || null;
      }

      const { error } = await supabase.from(tableMap[type]).insert(payload);

      if (error) throw error;

      show(t('requests.requestSent'), 'success');
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
        <View style={styles.headerIcon}>{icons[type] || icons.investment}</View>
        <Text style={styles.headerTitle}>{titles[type] || ''}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {type === 'investment' && (
          <>
            <Input label={t('land.type')} value={investmentType} onChangeText={setInvestmentType} placeholder={t('land.type')} />
            <Input label={t('requests.duration') + ' (شهر)'} value={duration} onChangeText={setDuration} placeholder="12" keyboardType="numeric" />
            <Input label={t('requests.project')} value={projectDesc} onChangeText={setProjectDesc} placeholder={t('requests.project')} multiline numberOfLines={3} />
            <Input label={t('requests.budget') + ' (DZD)'} value={budget} onChangeText={setBudget} placeholder="0" keyboardType="numeric" />
            <Input label={t('requests.experience')} value={experience} onChangeText={setExperience} placeholder={t('requests.experience')} multiline numberOfLines={2} />
            <Input label={t('requests.notes')} value={notes} onChangeText={setNotes} placeholder={t('requests.notes')} multiline numberOfLines={2} />
          </>
        )}
        {type === 'rental' && (
          <>
            <Input label={t('requests.duration') + ' (شهر)'} value={duration} onChangeText={setDuration} placeholder="12" keyboardType="numeric" />
            <Input label={t('requests.budget') + ' (DZD)'} value={budget} onChangeText={setBudget} placeholder="0" keyboardType="numeric" />
            <Input label="الشروط المقترحة" value={proposedTerms} onChangeText={setProposedTerms} placeholder="الشروط المقترحة" multiline numberOfLines={3} />
            <Input label={t('requests.notes')} value={notes} onChangeText={setNotes} placeholder={t('requests.notes')} multiline numberOfLines={2} />
          </>
        )}
        {type === 'partnership' && (
          <>
            <Input label={t('requests.duration') + ' (شهر)'} value={duration} onChangeText={setDuration} placeholder="12" keyboardType="numeric" />
            <Input label="الشروط المقترحة" value={proposedTerms} onChangeText={setProposedTerms} placeholder="الشروط المقترحة" multiline numberOfLines={3} />
            <Input label={t('requests.notes')} value={notes} onChangeText={setNotes} placeholder={t('requests.notes')} multiline numberOfLines={2} />
          </>
        )}
      </ScrollView>

      <View style={styles.bottomBar} pointerEvents={guestMode ? 'none' : 'auto'}>
        <Button title={t('requests.sendRequest')} onPress={handleSubmit} loading={submitting} fullWidth size="lg" />
      </View>

      <AccountRequiredModal visible={showAccountRequired} onDismiss={() => { setShowAccountRequired(false); router.back(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.primary.main },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.neutral.white, flex: 1, fontFamily: 'System' },
  body: { flex: 1, padding: 16 },
  bottomBar: { padding: 16, paddingBottom: 32, backgroundColor: Colors.neutral.white, borderTopWidth: 1, borderTopColor: Colors.neutral.borderLight },
});
