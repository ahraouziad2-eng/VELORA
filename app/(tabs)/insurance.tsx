import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ShieldCheck, ChevronLeft, Plus, X, MapPin, Phone, Wallet } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Select } from '@/components/ui/Select';
import { WILAYAS } from '@/constants/wilayas';

type InsuranceType = 'CROP' | 'LIVESTOCK' | 'EQUIPMENT' | 'FARM_LIABILITY' | 'LIFE' | 'OTHER';
type InsuranceStatus = 'PENDING' | 'UNDER_REVIEW' | 'QUOTE_PROVIDED' | 'REJECTED' | 'CLOSED';

interface InsuranceRow {
  id: string;
  insurance_type: InsuranceType;
  description: string;
  wilaya: string;
  contact_phone: string | null;
  budget_range: string | null;
  status: InsuranceStatus;
  user_id: string;
  created_at: string;
}

const insuranceTypeOptions: { value: InsuranceType }[] = [
  { value: 'CROP' },
  { value: 'LIVESTOCK' },
  { value: 'EQUIPMENT' },
  { value: 'FARM_LIABILITY' },
  { value: 'LIFE' },
  { value: 'OTHER' },
];

export default function InsuranceScreen() {
  const { profile, guestMode } = useAuth();
  const { t } = useI18n();
  const { show } = useToast();
  const [requests, setRequests] = useState<InsuranceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_requests')
        .select('id, insurance_type, description, wilaya, contact_phone, budget_range, status, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) {
        setRequests(data as InsuranceRow[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests();
  }, [loadRequests]);

  const getTypeBadge = (type: InsuranceType) => {
    const map: Record<InsuranceType, { label: string; variant: 'primary' | 'secondary' | 'accent' | 'info' | 'neutral' }> = {
      CROP: { label: t('insuranceType.crop'), variant: 'primary' },
      LIVESTOCK: { label: t('insuranceType.livestock'), variant: 'secondary' },
      EQUIPMENT: { label: t('insuranceType.equipment'), variant: 'accent' },
      FARM_LIABILITY: { label: t('insuranceType.farmLiability'), variant: 'info' },
      LIFE: { label: t('insuranceType.life'), variant: 'neutral' },
      OTHER: { label: t('insuranceType.other'), variant: 'neutral' },
    };
    return map[type];
  };

  const getStatusBadge = (status: InsuranceStatus) => {
    const map: Record<InsuranceStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
      PENDING: { label: t('status.pending'), variant: 'warning' },
      UNDER_REVIEW: { label: t('status.underReview'), variant: 'info' },
      QUOTE_PROVIDED: { label: t('insuranceStatus.quoteProvided'), variant: 'success' },
      REJECTED: { label: t('status.rejected'), variant: 'error' },
      CLOSED: { label: t('insuranceStatus.closed'), variant: 'neutral' },
    };
    return map[status];
  };

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
        <View style={styles.headerIcon}><ShieldCheck size={20} color={Colors.neutral.white} /></View>
        <Text style={styles.headerTitle}>{t('insurance.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {!guestMode && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
            <Plus size={20} color={Colors.neutral.white} />
            <Text style={styles.addBtnText}>{t('insurance.requestQuote')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.main]} />}
        ListEmptyComponent={<EmptyState icon={<ShieldCheck size={48} color={Colors.neutral.border} />} title={t('insurance.empty')} />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const typeBadge = getTypeBadge(item.insurance_type);
          const statusBadge = getStatusBadge(item.status);
          const isOwn = item.user_id === profile?.id;
          if (!isOwn && !guestMode) return null;
          return (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <ShieldCheck size={18} color={Colors.primary.main} />
                  <Text style={styles.cardTitle}>{typeBadge.label}</Text>
                </View>
                <Badge label={statusBadge.label} variant={statusBadge.variant} />
              </View>
              <Text style={styles.cardDesc}>{item.description}</Text>
              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <MapPin size={14} color={Colors.neutral.textMuted} />
                  <Text style={styles.metaText}>{item.wilaya}</Text>
                </View>
                {item.contact_phone && (
                  <View style={styles.metaItem}>
                    <Phone size={14} color={Colors.neutral.textMuted} />
                    <Text style={styles.metaText}>{item.contact_phone}</Text>
                  </View>
                )}
                {item.budget_range && (
                  <View style={styles.metaItem}>
                    <Wallet size={14} color={Colors.neutral.textMuted} />
                    <Text style={styles.metaText}>{item.budget_range}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString('ar-DZ')}</Text>
            </Card>
          );
        }}
      />

      <CreateInsuranceModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadRequests(); }} t={t} show={show} />
    </View>
  );
}

function CreateInsuranceModal({ visible, onClose, onCreated, t, show }: { visible: boolean; onClose: () => void; onCreated: () => void; t: (k: string) => string; show: (msg: string, type: 'success' | 'error') => void }) {
  const { profile } = useAuth();
  const [insuranceType, setInsuranceType] = useState('');
  const [description, setDescription] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setInsuranceType(''); setDescription(''); setWilaya(''); setContactPhone(''); setBudgetRange('');
  };

  const handleSubmit = async () => {
    if (!insuranceType || !description || !wilaya) {
      show(t('auth.fillAllFields'), 'error');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('insurance_requests').insert({
        user_id: profile?.id,
        insurance_type: insuranceType,
        description,
        wilaya,
        contact_phone: contactPhone || null,
        budget_range: budgetRange || null,
        status: 'PENDING',
      });
      if (error) throw error;
      show(t('insurance.requestSuccess'), 'success');
      reset();
      onCreated();
    } catch {
      show(t('common.error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('insurance.requestQuote')}</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color={Colors.neutral.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Select label={t('insurance.type')} value={insuranceType} options={insuranceTypeOptions.map((o) => ({ label: t(`insuranceType.${o.value.toLowerCase().replace('_', '')}`), value: o.value }))} onSelect={setInsuranceType} placeholder={t('common.all')} />
            <TextInput style={[styles.input, styles.textArea]} placeholder={t('insurance.description')} placeholderTextColor={Colors.neutral.light} value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" />
            <Select label={t('land.wilaya')} value={wilaya} options={WILAYAS.map((w) => ({ label: `${w.nameAr} (${w.code})`, value: w.nameAr }))} onSelect={setWilaya} placeholder={t('auth.selectWilaya')} />
            <TextInput style={styles.input} placeholder={t('insurance.contactPhone')} placeholderTextColor={Colors.neutral.light} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder={t('insurance.budgetRange')} placeholderTextColor={Colors.neutral.light} value={budgetRange} onChangeText={setBudgetRange} />
            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.submitBtnText}>{submitting ? t('common.loading') : t('insurance.submit')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.primary.dark },
  backBtn: { padding: 4 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.neutral.white, flex: 1, fontFamily: 'System' },
  actionBar: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.neutral.white, borderBottomWidth: 1, borderBottomColor: Colors.neutral.borderLight },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary.main, paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.md, justifyContent: 'center' },
  addBtnText: { color: Colors.neutral.white, fontSize: 15, fontWeight: '700', fontFamily: 'System' },
  list: { padding: 16, gap: 12 },
  card: { gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.neutral.text, fontFamily: 'System' },
  cardDesc: { fontSize: 14, color: Colors.neutral.textLight, lineHeight: 20, fontFamily: 'System' },
  cardMeta: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: Colors.neutral.textMuted, fontFamily: 'System' },
  dateText: { fontSize: 12, color: Colors.neutral.light, fontFamily: 'System' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { backgroundColor: Colors.neutral.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.neutral.text, fontFamily: 'System' },
  input: { backgroundColor: Colors.neutral.surface, borderWidth: 1.5, borderColor: Colors.neutral.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.neutral.text, marginBottom: 12, fontFamily: 'System' },
  textArea: { minHeight: 80, textAlignVertical: 'top' as any },
  submitBtn: { backgroundColor: Colors.primary.main, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: Colors.neutral.white, fontSize: 16, fontWeight: '700', fontFamily: 'System' },
});
