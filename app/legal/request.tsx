import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Scale, Landmark, FileText, FileSignature, Handshake, Gavel, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { AccountRequiredModal } from '@/components/ui/AccountRequiredModal';

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  PROPERTY_CONSULTATION: <Landmark size={24} color={Colors.primary.main} />,
  DOC_REVIEW: <FileText size={24} color={Colors.primary.main} />,
  RENT_CONTRACT_HELP: <FileSignature size={24} color={Colors.primary.main} />,
  PARTNERSHIP_CONTRACT_HELP: <Handshake size={24} color={Colors.primary.main} />,
  LEGAL_GUIDANCE: <Scale size={24} color={Colors.primary.main} />,
  DISPUTE_REPORT: <AlertTriangle size={24} color={Colors.primary.main} />,
};

interface LegalRequestRow {
  id: string;
  service_type: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

export default function LegalRequestScreen() {
  const { user, guestMode } = useAuth();
  const { t } = useI18n();
  const { show } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<LegalRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountRequired, setShowAccountRequired] = useState(guestMode);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('legal_requests')
        .select('id, service_type, description, priority, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setMyRequests(data as LegalRequestRow[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleSubmit = async () => {
    if (!user || !selectedService || !description) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('legal_requests').insert({
        user_id: user.id,
        service_type: selectedService,
        description,
        priority,
        status: 'PENDING',
      });

      if (error) throw error;

      show(t('common.success'), 'success');
      setSelectedService('');
      setDescription('');
      setPriority('MEDIUM');
      setShowForm(false);
      loadRequests();
    } catch {
      show(t('common.error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
      PENDING: { label: t('status.pending'), variant: 'warning' },
      UNDER_REVIEW: { label: t('status.underReview'), variant: 'info' },
      ACCEPTED: { label: t('status.accepted'), variant: 'success' },
      REJECTED: { label: t('status.rejected'), variant: 'error' },
      COMPLETED: { label: t('status.completed'), variant: 'success' },
    };
    return map[status] || { label: status, variant: 'neutral' };
  };

  const services = [
    { type: 'PROPERTY_CONSULTATION', label: t('legal.propertyConsultation') },
    { type: 'DOC_REVIEW', label: t('legal.docReview') },
    { type: 'RENT_CONTRACT_HELP', label: t('legal.rentContractHelp') },
    { type: 'PARTNERSHIP_CONTRACT_HELP', label: t('legal.partnershipContractHelp') },
    { type: 'LEGAL_GUIDANCE', label: t('legal.legalGuidance') },
    { type: 'DISPUTE_REPORT', label: t('legal.disputeReport') },
  ];

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronRight size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
        <View style={styles.headerIcon}><Scale size={22} color={Colors.neutral.white} /></View>
        <Text style={styles.headerTitle}>{t('legal.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {!showForm ? (
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.servicesGrid}>
            {services.map((svc) => (
              <TouchableOpacity key={svc.type} onPress={() => { setSelectedService(svc.type); setShowForm(true); }} activeOpacity={0.85}>
                <Card style={styles.serviceCard}>
                  <View style={styles.serviceIcon}>{SERVICE_ICONS[svc.type]}</View>
                  <Text style={styles.serviceLabel}>{svc.label}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>{t('legal.myRequests')}</Text>
          {myRequests.length === 0 ? (
            <EmptyState icon={<Scale size={48} color={Colors.neutral.border} />} title={t('requests.empty')} />
          ) : (
            myRequests.map((req) => {
              const badge = getStatusBadge(req.status);
              const svcLabel = services.find((s) => s.type === req.service_type)?.label || req.service_type;
              return (
                <Card key={req.id} style={styles.reqCard}>
                  <View style={styles.reqHeader}>
                    <Text style={styles.reqService}>{svcLabel}</Text>
                    <Badge label={badge.label} variant={badge.variant} />
                  </View>
                  <Text style={styles.reqDesc} numberOfLines={2}>{req.description}</Text>
                  <Text style={styles.reqDate}>{new Date(req.created_at).toLocaleDateString('ar-DZ')}</Text>
                </Card>
              );
            })
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={styles.formLabel}>{t('legal.title')}</Text>
          <Select
            label={t('legal.title')}
            value={selectedService}
            options={services.map((s) => ({ label: s.label, value: s.type }))}
            onSelect={setSelectedService}
            placeholder={t('legal.title')}
          />
          <Input label={t('report.description')} value={description} onChangeText={setDescription} placeholder={t('report.description')} multiline numberOfLines={4} />
          <Select
            label={t('legal.priority')}
            value={priority}
            options={[
              { label: t('priority.low'), value: 'LOW' },
              { label: t('priority.medium'), value: 'MEDIUM' },
              { label: t('priority.high'), value: 'HIGH' },
              { label: t('priority.urgent'), value: 'URGENT' },
            ]}
            onSelect={setPriority}
            placeholder={t('legal.priority')}
          />
          <View style={styles.formActions}>
            <Button title={t('common.cancel')} onPress={() => setShowForm(false)} variant="outline" size="md" />
            <Button title={t('legal.sendRequest')} onPress={handleSubmit} loading={submitting} size="md" style={{ flex: 1 }} disabled={!selectedService || !description} />
          </View>
        </ScrollView>
      )}

      <AccountRequiredModal visible={showAccountRequired} onDismiss={() => { setShowAccountRequired(false); router.back(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.secondary.main },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.neutral.white, flex: 1, fontFamily: 'System' },
  body: { flex: 1, padding: 16 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  serviceCard: { width: '47%', alignItems: 'center', gap: 12, paddingVertical: 20 },
  serviceIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primary.bg, alignItems: 'center', justifyContent: 'center' },
  serviceLabel: { fontSize: 14, fontWeight: '600', color: Colors.neutral.text, textAlign: 'center', fontFamily: 'System' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.neutral.text, marginTop: 24, marginBottom: 12, fontFamily: 'System' },
  reqCard: { gap: 8, marginBottom: 10 },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reqService: { fontSize: 15, fontWeight: '700', color: Colors.neutral.text, flex: 1, fontFamily: 'System' },
  reqDesc: { fontSize: 14, color: Colors.neutral.textLight, fontFamily: 'System' },
  reqDate: { fontSize: 12, color: Colors.neutral.light, fontFamily: 'System' },
  formLabel: { fontSize: 18, fontWeight: '700', color: Colors.neutral.text, marginBottom: 12, fontFamily: 'System' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
});
