import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Briefcase, MapPin, Plus, X, Search, Clock, Wallet } from 'lucide-react-native';
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
import { PageHero } from '@/components/PageHero';
import { PAGE_HERO_CONFIG } from '@/constants/pageHero';

type JobType = 'FULL_TIME' | 'PART_TIME' | 'SEASONAL' | 'CONTRACT' | 'INTERNSHIP';
type JobStatus = 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';

interface JobRow {
  id: string;
  title: string;
  description: string;
  wilaya: string;
  commune: string;
  job_type: JobType;
  salary_range: string | null;
  requirements: string | null;
  contact_info: string | null;
  status: JobStatus;
  employer_id: string;
  created_at: string;
}

const jobTypeOptions = [
  { label: 'Full Time', value: 'FULL_TIME' },
  { label: 'Part Time', value: 'PART_TIME' },
  { label: 'Seasonal', value: 'SEASONAL' },
  { label: 'Contract', value: 'CONTRACT' },
  { label: 'Internship', value: 'INTERNSHIP' },
];

export default function JobsScreen() {
  const { profile, guestMode } = useAuth();
  const { t } = useI18n();
  const { show } = useToast();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showApply, setShowApply] = useState<JobRow | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      let query = supabase
        .from('job_listings')
        .select('id, title, description, wilaya, commune, job_type, salary_range, requirements, contact_info, status, employer_id, created_at')
        .order('created_at', { ascending: false });

      if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

      const { data, error } = await query.limit(50);
      if (!error && data) {
        setJobs(data as JobRow[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    loadJobs();
  }, [loadJobs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadJobs();
  }, [loadJobs]);

  const getJobTypeBadge = (type: JobType) => {
    const map: Record<JobType, { label: string; variant: 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' }> = {
      FULL_TIME: { label: t('jobType.fullTime'), variant: 'primary' },
      PART_TIME: { label: t('jobType.partTime'), variant: 'accent' },
      SEASONAL: { label: t('jobType.seasonal'), variant: 'secondary' },
      CONTRACT: { label: t('jobType.contract'), variant: 'info' },
      INTERNSHIP: { label: t('jobType.internship'), variant: 'neutral' },
    };
    return map[type];
  };

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <PageHero title={t('jobs.title')} subtitle="فرص العمل والتعاون في القطاع الفلاحي" config={PAGE_HERO_CONFIG.jobs} />

      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Search size={18} color={Colors.neutral.light} />
          <TextInput
            style={styles.searchText}
            placeholder={t('common.search')}
            placeholderTextColor={Colors.neutral.light}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={Colors.neutral.light} />
            </TouchableOpacity>
          ) : null}
        </View>
        {!guestMode && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
            <Plus size={22} color={Colors.neutral.white} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.main]} />}
        ListEmptyComponent={<EmptyState icon={<Briefcase size={48} color={Colors.neutral.border} />} title={t('jobs.empty')} />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const badge = getJobTypeBadge(item.job_type);
          const isOwn = item.employer_id === profile?.id;
          return (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Briefcase size={18} color={Colors.primary.main} />
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                </View>
                <Badge label={badge.label} variant={badge.variant} />
              </View>
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <MapPin size={14} color={Colors.neutral.textMuted} />
                  <Text style={styles.metaText}>{item.wilaya} - {item.commune}</Text>
                </View>
                {item.salary_range && (
                  <View style={styles.metaItem}>
                    <Wallet size={14} color={Colors.neutral.textMuted} />
                    <Text style={styles.metaText}>{item.salary_range}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString('ar-DZ')}</Text>
                {!isOwn && item.status === 'PUBLISHED' && !guestMode && (
                  <TouchableOpacity style={styles.applyBtn} onPress={() => setShowApply(item)}>
                    <Text style={styles.applyBtnText}>{t('jobs.apply')}</Text>
                  </TouchableOpacity>
                )}
                {isOwn && item.status === 'PENDING_REVIEW' && (
                  <Badge label={t('status.pending')} variant="warning" />
                )}
              </View>
            </Card>
          );
        }}
      />

      <CreateJobModal visible={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadJobs(); }} t={t} show={show} />
      <ApplyJobModal job={showApply} onClose={() => setShowApply(null)} onApplied={() => { setShowApply(null); }} t={t} show={show} />
    </View>
  );
}

function CreateJobModal({ visible, onClose, onCreated, t, show }: { visible: boolean; onClose: () => void; onCreated: () => void; t: (k: string) => string; show: (msg: string, type: 'success' | 'error') => void }) {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [jobType, setJobType] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [requirements, setRequirements] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle(''); setDescription(''); setWilaya(''); setCommune(''); setJobType(''); setSalaryRange(''); setRequirements(''); setContactInfo('');
  };

  const handleSubmit = async () => {
    if (!title || !description || !wilaya || !commune || !jobType) {
      show(t('auth.fillAllFields'), 'error');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('job_listings').insert({
        employer_id: profile?.id,
        title,
        description,
        wilaya,
        commune,
        job_type: jobType,
        salary_range: salaryRange || null,
        requirements: requirements || null,
        contact_info: contactInfo || null,
        status: 'PENDING_REVIEW',
      });
      if (error) throw error;
      show(t('jobs.postSuccess'), 'success');
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
            <Text style={styles.modalTitle}>{t('jobs.postJob')}</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color={Colors.neutral.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <TextInput style={styles.input} placeholder={t('jobs.jobTitle')} placeholderTextColor={Colors.neutral.light} value={title} onChangeText={setTitle} />
            <TextInput style={[styles.input, styles.textArea]} placeholder={t('jobs.jobDescription')} placeholderTextColor={Colors.neutral.light} value={description} onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" />
            <Select label={t('land.wilaya')} value={wilaya} options={WILAYAS.map((w) => ({ label: `${w.nameAr} (${w.code})`, value: w.nameAr }))} onSelect={setWilaya} placeholder={t('auth.selectWilaya')} />
            <TextInput style={styles.input} placeholder={t('land.commune')} placeholderTextColor={Colors.neutral.light} value={commune} onChangeText={setCommune} />
            <Select label={t('jobs.jobType')} value={jobType} options={jobTypeOptions.map((o) => ({ label: t(`jobType.${o.value.toLowerCase().replace('_', '')}`), value: o.value }))} onSelect={setJobType} placeholder={t('common.all')} />
            <TextInput style={styles.input} placeholder={t('jobs.salaryRange')} placeholderTextColor={Colors.neutral.light} value={salaryRange} onChangeText={setSalaryRange} />
            <TextInput style={[styles.input, styles.textArea]} placeholder={t('jobs.requirements')} placeholderTextColor={Colors.neutral.light} value={requirements} onChangeText={setRequirements} multiline numberOfLines={3} textAlignVertical="top" />
            <TextInput style={styles.input} placeholder={t('jobs.contactInfo')} placeholderTextColor={Colors.neutral.light} value={contactInfo} onChangeText={setContactInfo} />
            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.submitBtnText}>{submitting ? t('common.loading') : t('jobs.submit')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ApplyJobModal({ job, onClose, onApplied, t, show }: { job: JobRow | null; onClose: () => void; onApplied: () => void; t: (k: string) => string; show: (msg: string, type: 'success' | 'error') => void }) {
  const { profile } = useAuth();
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!job) return;
    if (!coverLetter) {
      show(t('auth.fillAllFields'), 'error');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('job_applications').insert({
        job_id: job.id,
        applicant_id: profile?.id,
        cover_letter: coverLetter,
        resume_url: resumeUrl || null,
        status: 'PENDING',
      });
      if (error) throw error;
      show(t('jobs.applySuccess'), 'success');
      setCoverLetter(''); setResumeUrl('');
      onApplied();
    } catch {
      show(t('common.error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={!!job} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('jobs.applyFor')}</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color={Colors.neutral.textMuted} /></TouchableOpacity>
          </View>
          {job && (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.applyJobTitle}>{job.title}</Text>
              <Text style={styles.applyJobMeta}>{job.wilaya} - {job.commune}</Text>
            </View>
          )}
          <TextInput style={[styles.input, styles.textArea]} placeholder={t('jobs.coverLetter')} placeholderTextColor={Colors.neutral.light} value={coverLetter} onChangeText={setCoverLetter} multiline numberOfLines={5} textAlignVertical="top" />
          <TextInput style={styles.input} placeholder={t('jobs.resumeUrl')} placeholderTextColor={Colors.neutral.light} value={resumeUrl} onChangeText={setResumeUrl} />
          <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.submitBtnText}>{submitting ? t('common.loading') : t('jobs.submit')}</Text>
          </TouchableOpacity>
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
  searchBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: Colors.neutral.white, borderBottomWidth: 1, borderBottomColor: Colors.neutral.borderLight },
  searchInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.neutral.surface, borderRadius: radius.md, paddingHorizontal: 12, gap: 8, height: 44 },
  searchText: { flex: 1, fontSize: 15, color: Colors.neutral.text, fontFamily: 'System' },
  addBtn: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: Colors.primary.main, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  card: { gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.neutral.text, flex: 1, fontFamily: 'System' },
  cardDesc: { fontSize: 14, color: Colors.neutral.textLight, lineHeight: 20, fontFamily: 'System' },
  cardMeta: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: Colors.neutral.textMuted, fontFamily: 'System' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.neutral.borderLight, paddingTop: 8 },
  dateText: { fontSize: 12, color: Colors.neutral.light, fontFamily: 'System' },
  applyBtn: { backgroundColor: Colors.primary.main, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.sm },
  applyBtnText: { color: Colors.neutral.white, fontSize: 13, fontWeight: '700', fontFamily: 'System' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { backgroundColor: Colors.neutral.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.neutral.text, fontFamily: 'System' },
  input: { backgroundColor: Colors.neutral.surface, borderWidth: 1.5, borderColor: Colors.neutral.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.neutral.text, marginBottom: 12, fontFamily: 'System' },
  textArea: { minHeight: 80, textAlignVertical: 'top' as any },
  submitBtn: { backgroundColor: Colors.primary.main, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: Colors.neutral.white, fontSize: 16, fontWeight: '700', fontFamily: 'System' },
  applyJobTitle: { fontSize: 18, fontWeight: '700', color: Colors.neutral.text, fontFamily: 'System' },
  applyJobMeta: { fontSize: 14, color: Colors.neutral.textMuted, marginTop: 4, fontFamily: 'System' },
});
