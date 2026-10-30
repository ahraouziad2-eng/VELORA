import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, FlatList, Alert, TextInput, Modal } from 'react-native';
import { router } from 'expo-router';
import { Users, MapPin, BadgeCheck, Clock, TrendingUp, Home, Handshake, Flag, FileText, ChevronLeft, Check, X, AlertCircle, Shield, Briefcase, ShieldCheck, Megaphone, Mail, Globe, Plus, Trash2, Edit3, Sparkles, BarChart3 } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { BrandLogo } from '@/components/BrandLogo';
import { SafeImage } from '@/components/SafeImage';
import { FALLBACK_IMAGE } from '@/src/data/demoImages';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';

type AdminTab = 'dashboard' | 'lands' | 'users' | 'reports' | 'services' | 'content';

interface LandRow {
  id: string;
  name: string;
  wilaya: string;
  commune: string;
  area: number;
  verification_status: string;
  is_published: boolean;
  owner_id: string;
  land_images: { image_url: string; is_primary: boolean }[];
}

interface UserRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  wilaya: string | null;
  is_active: boolean;
  is_verified: boolean;
}

interface ReportRow {
  id: string;
  report_type: string;
  description: string;
  status: string;
  target_type: string;
  created_at: string;
}

export default function AdminScreen() {
  const { roles } = useAuth();
  const { t } = useI18n();
  const { show } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ users: 0, lands: 0, verified: 0, pending: 0, reports: 0, investments: 0, rentals: 0, partnerships: 0, jobs: 0, ads: 0, insurance: 0, contacts: 0 });
  const [lands, setLands] = useState<LandRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);

  const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </TouchableOpacity>
          <View style={styles.headerIcon}><Shield size={20} color={Colors.neutral.white} /></View>
          <Text style={styles.headerTitle}>{t('admin.title')}</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Shield size={48} color={Colors.neutral.border} />
          <Text style={{ fontSize: 16, color: Colors.neutral.textMuted, textAlign: 'center', marginTop: 16, fontFamily: 'System' }}>
            {t('common.notFound')}
          </Text>
        </View>
      </View>
    );
  }

  const loadDashboard = useCallback(async () => {
    try {
      const [usersRes, landsRes, verifiedRes, pendingRes, reportsRes, invRes, rentRes, partRes, jobsRes, adsRes, insRes, contactsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('lands').select('*', { count: 'exact', head: true }),
        supabase.from('lands').select('*', { count: 'exact', head: true }).eq('verification_status', 'VERIFIED'),
        supabase.from('lands').select('*', { count: 'exact', head: true }).eq('verification_status', 'PENDING_REVIEW'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
        supabase.from('land_investment_requests').select('*', { count: 'exact', head: true }),
        supabase.from('rental_requests').select('*', { count: 'exact', head: true }),
        supabase.from('partnership_requests').select('*', { count: 'exact', head: true }),
        supabase.from('job_listings').select('*', { count: 'exact', head: true }).eq('status', 'PENDING_REVIEW'),
        supabase.from('advertisements').select('*', { count: 'exact', head: true }).eq('status', 'PENDING_REVIEW'),
        supabase.from('insurance_requests').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('status', 'NEW'),
      ]);
      // Destructure contacts result

      setStats({
        users: usersRes.count || 0,
        lands: landsRes.count || 0,
        verified: verifiedRes.count || 0,
        pending: pendingRes.count || 0,
        reports: reportsRes.count || 0,
        investments: invRes.count || 0,
        rentals: rentRes.count || 0,
        partnerships: partRes.count || 0,
        jobs: jobsRes.count || 0,
        ads: adsRes.count || 0,
        insurance: insRes.count || 0,
        contacts: contactsRes.count || 0,
      });
    } catch {
      // silent
    }
  }, []);

  const loadLands = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('lands')
        .select(`
          id, name, wilaya, commune, area, verification_status, is_published, owner_id,
          land_images(image_url, is_primary)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) setLands(data as unknown as LandRow[]);
    } catch {
      // silent
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, wilaya, is_active, is_verified')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) setUsers(data as UserRow[]);
    } catch {
      // silent
    }
  }, []);

  const loadReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('id, report_type, description, status, target_type, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) setReports(data as ReportRow[]);
    } catch {
      // silent
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadDashboard(), loadLands(), loadUsers(), loadReports()]);
    setLoading(false);
    setRefreshing(false);
  }, [loadDashboard, loadLands, loadUsers, loadReports]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAll();
  }, [loadAll]);

  const approveLand = async (id: string) => {
    const { error } = await supabase.from('lands').update({ verification_status: 'VERIFIED', is_published: true }).eq('id', id);
    if (error) {
      show(t('common.error'), 'error');
    } else {
      show(t('common.success'), 'success');
      loadLands();
      loadDashboard();
    }
  };

  const rejectLand = async (id: string) => {
    const { error } = await supabase.from('lands').update({ verification_status: 'REJECTED', is_published: false }).eq('id', id);
    if (error) {
      show(t('common.error'), 'error');
    } else {
      show(t('common.success'), 'success');
      loadLands();
      loadDashboard();
    }
  };

  const requestInfo = async (id: string) => {
    const { error } = await supabase.from('lands').update({ verification_status: 'NEEDS_INFO' }).eq('id', id);
    if (error) {
      show(t('common.error'), 'error');
    } else {
      show(t('common.success'), 'success');
      loadLands();
    }
  };

  const resolveReport = async (id: string) => {
    const { error } = await supabase.from('reports').update({ status: 'RESOLVED' }).eq('id', id);
    if (error) {
      show(t('common.error'), 'error');
    } else {
      show(t('common.success'), 'success');
      loadReports();
      loadDashboard();
    }
  };

  if (loading) return <LoadingState />;

  const statCards = [
    { icon: <Users size={22} color={Colors.accent.main} />, label: t('admin.totalUsers'), value: stats.users, bg: Colors.accent.bg },
    { icon: <MapPin size={22} color={Colors.primary.main} />, label: t('admin.totalLands'), value: stats.lands, bg: Colors.primary.bg },
    { icon: <BadgeCheck size={22} color={Colors.success.main} />, label: t('admin.verifiedLands'), value: stats.verified, bg: Colors.success.bg },
    { icon: <Clock size={22} color={Colors.warning.main} />, label: t('admin.pendingLands'), value: stats.pending, bg: Colors.warning.bg },
    { icon: <TrendingUp size={22} color={Colors.secondary.main} />, label: t('admin.investmentReqs'), value: stats.investments, bg: Colors.secondary.bg },
    { icon: <Home size={22} color={Colors.primary.main} />, label: t('admin.rentalReqs'), value: stats.rentals, bg: Colors.primary.bg },
    { icon: <Handshake size={22} color={Colors.accent.main} />, label: t('admin.partnershipReqs'), value: stats.partnerships, bg: Colors.accent.bg },
    { icon: <Flag size={22} color={Colors.error.main} />, label: t('admin.reportsCount'), value: stats.reports, bg: Colors.error.bg },
    { icon: <Briefcase size={22} color={Colors.secondary.main} />, label: t('admin.jobsPending'), value: stats.jobs, bg: Colors.secondary.bg },
    { icon: <Megaphone size={22} color={Colors.accent.main} />, label: t('admin.adsPending'), value: stats.ads, bg: Colors.accent.bg },
    { icon: <ShieldCheck size={22} color={Colors.primary.dark} />, label: t('admin.insurancePending'), value: stats.insurance, bg: Colors.primary.bg },
    { icon: <Mail size={22} color={Colors.accent.main} />, label: t('admin.contactInbox'), value: stats.contacts, bg: Colors.accent.bg },
  ];

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'dashboard', label: t('admin.dashboard') },
    { key: 'lands', label: t('admin.lands') },
    { key: 'users', label: t('admin.users') },
    { key: 'reports', label: t('admin.reports') },
    { key: 'services', label: t('admin.services') },
    { key: 'content', label: t('admin.contentTab') },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <View style={styles.headerIcon}><BrandLogo variant="mark" size={28} /></View>
        <Text style={styles.headerTitle}>{t('admin.title')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)} style={[styles.tab, activeTab === tab.key && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.main]} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {activeTab === 'dashboard' && (
          <View style={styles.statsGrid}>
            {statCards.map((stat, i) => (
              <Card key={i} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>{stat.icon}</View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </Card>
            ))}
          </View>
        )}

        {activeTab === 'lands' && (
          <View style={styles.listSection}>
            {lands.length === 0 ? (
              <EmptyState icon={<MapPin size={48} color={Colors.neutral.border} />} title={t('common.noData')} />
            ) : (
              lands.map((land) => {
                const img = land.land_images?.find((i) => i.is_primary)?.image_url || land.land_images?.[0]?.image_url;
                return (
                  <Card key={land.id} style={styles.landCard}>
                    <View style={styles.landTop}>
                      <SafeImage uri={img ?? null} fallback={FALLBACK_IMAGE.lands} style={styles.landImg} />
                      <View style={styles.landInfo}>
                        <Text style={styles.landName} numberOfLines={1}>{land.name}</Text>
                        <Text style={styles.landLoc}>{land.wilaya} - {land.commune}</Text>
                        <Text style={styles.landArea}>{land.area} {t('land.hectare')}</Text>
                      </View>
                      <Badge label={land.verification_status === 'VERIFIED' ? t('land.verified') : land.verification_status === 'PENDING_REVIEW' ? t('land.pendingReview') : land.verification_status === 'REJECTED' ? t('land.rejected') : t('land.needsInfo')} variant={land.verification_status === 'VERIFIED' ? 'success' : land.verification_status === 'PENDING_REVIEW' ? 'warning' : land.verification_status === 'REJECTED' ? 'error' : 'info'} />
                    </View>
                    {land.verification_status !== 'VERIFIED' && (
                      <View style={styles.landActions}>
                        <TouchableOpacity onPress={() => approveLand(land.id)} style={styles.actionBtnApprove}>
                          <Check size={16} color={Colors.success.main} />
                          <Text style={styles.actionTextApprove}>{t('admin.approve')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => rejectLand(land.id)} style={styles.actionBtnReject}>
                          <X size={16} color={Colors.error.main} />
                          <Text style={styles.actionTextReject}>{t('admin.reject')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => requestInfo(land.id)} style={styles.actionBtnInfo}>
                          <AlertCircle size={16} color={Colors.warning.main} />
                          <Text style={styles.actionTextInfo}>{t('admin.requestInfo')}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </Card>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'users' && (
          <View style={styles.listSection}>
            {users.length === 0 ? (
              <EmptyState icon={<Users size={48} color={Colors.neutral.border} />} title={t('common.noData')} />
            ) : (
              users.map((u) => (
                <Card key={u.id} style={styles.userCard}>
                  <View style={styles.userTop}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userInitial}>{(u.full_name || '?')[0]}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{u.full_name || '---'}</Text>
                      <Text style={styles.userPhone}>{u.phone || '---'}</Text>
                      <Text style={styles.userWilaya}>{u.wilaya || '---'}</Text>
                    </View>
                    <View style={styles.userBadges}>
                      {u.is_verified && <Badge label={t('land.verified')} variant="success" />}
                      <Badge label={u.is_active ? t('admin.activate') : t('admin.deactivate')} variant={u.is_active ? 'success' : 'error'} />
                    </View>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {activeTab === 'reports' && (
          <View style={styles.listSection}>
            {reports.length === 0 ? (
              <EmptyState icon={<Flag size={48} color={Colors.neutral.border} />} title={t('common.noData')} />
            ) : (
              reports.map((r) => (
                <Card key={r.id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <Flag size={16} color={Colors.error.main} />
                    <Text style={styles.reportType}>{r.report_type}</Text>
                    <Badge label={r.status === 'OPEN' ? t('reportStatus.open') : r.status === 'RESOLVED' ? t('reportStatus.resolved') : t('reportStatus.underReview')} variant={r.status === 'OPEN' ? 'error' : r.status === 'RESOLVED' ? 'success' : 'warning'} />
                  </View>
                  <Text style={styles.reportDesc} numberOfLines={2}>{r.description}</Text>
                  <Text style={styles.reportDate}>{new Date(r.created_at).toLocaleDateString('ar-DZ')}</Text>
                  {r.status === 'OPEN' && (
                    <TouchableOpacity onPress={() => resolveReport(r.id)} style={styles.resolveBtn}>
                      <Check size={14} color={Colors.success.main} />
                      <Text style={styles.resolveText}>{t('reportStatus.resolved')}</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              ))
            )}
          </View>
        )}

        {activeTab === 'services' && (
          <ServicesTab />
        )}

        {activeTab === 'content' && (
          <ContentTab />
        )}
      </ScrollView>
    </View>
  );
}

function ServicesTab() {
  const { t } = useI18n();
  const { show } = useToast();
  const [serviceType, setServiceType] = useState<'jobs' | 'ads' | 'insurance'>('jobs');
  const [jobs, setJobs] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [insurance, setInsurance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = useCallback(async () => {
    const { data, error } = await supabase.from('job_listings').select('id, title, wilaya, commune, status, employer_id, created_at').eq('status', 'PENDING_REVIEW').order('created_at', { ascending: false }).limit(30);
    if (!error && data) setJobs(data);
  }, []);

  const loadAds = useCallback(async () => {
    const { data, error } = await supabase.from('advertisements').select('id, title, category, wilaya, status, poster_id, created_at').eq('status', 'PENDING_REVIEW').order('created_at', { ascending: false }).limit(30);
    if (!error && data) setAds(data);
  }, []);

  const loadInsurance = useCallback(async () => {
    const { data, error } = await supabase.from('insurance_requests').select('id, insurance_type, wilaya, status, user_id, created_at').eq('status', 'PENDING').order('created_at', { ascending: false }).limit(30);
    if (!error && data) setInsurance(data);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadJobs(), loadAds(), loadInsurance()]).then(() => { setLoading(false); });
  }, [loadJobs, loadAds, loadInsurance]);

  const approveJob = async (id: string) => {
    const { error } = await supabase.from('job_listings').update({ status: 'PUBLISHED' }).eq('id', id);
    if (error) { show(t('common.error'), 'error'); } else { show(t('common.success'), 'success'); setJobs(jobs.filter((j) => j.id !== id)); }
  };
  const rejectJob = async (id: string) => {
    const { error } = await supabase.from('job_listings').update({ status: 'REJECTED' }).eq('id', id);
    if (error) { show(t('common.error'), 'error'); } else { show(t('common.success'), 'success'); setJobs(jobs.filter((j) => j.id !== id)); }
  };

  const approveAd = async (id: string) => {
    const { error } = await supabase.from('advertisements').update({ status: 'PUBLISHED' }).eq('id', id);
    if (error) { show(t('common.error'), 'error'); } else { show(t('common.success'), 'success'); setAds(ads.filter((a) => a.id !== id)); }
  };
  const rejectAd = async (id: string) => {
    const { error } = await supabase.from('advertisements').update({ status: 'REJECTED' }).eq('id', id);
    if (error) { show(t('common.error'), 'error'); } else { show(t('common.success'), 'success'); setAds(ads.filter((a) => a.id !== id)); }
  };

  const reviewInsurance = async (id: string) => {
    const { error } = await supabase.from('insurance_requests').update({ status: 'UNDER_REVIEW' }).eq('id', id);
    if (error) { show(t('common.error'), 'error'); } else { show(t('common.success'), 'success'); setInsurance(insurance.filter((i) => i.id !== id)); }
  };

  if (loading) return <LoadingState />;

  const serviceTabs: { key: typeof serviceType; label: string; icon: any }[] = [
    { key: 'jobs', label: t('jobs.title'), icon: Briefcase },
    { key: 'ads', label: t('ads.title'), icon: Megaphone },
    { key: 'insurance', label: t('insurance.title'), icon: ShieldCheck },
  ];

  return (
    <View style={styles.listSection}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {serviceTabs.map((st) => {
          const Icon = st.icon;
          const active = serviceType === st.key;
          return (
            <TouchableOpacity key={st.key} onPress={() => setServiceType(st.key)} style={[styles.subTab, active && styles.subTabActive]}>
              <Icon size={16} color={active ? Colors.primary.main : Colors.neutral.textMuted} />
              <Text style={[styles.subTabText, active && styles.subTabTextActive]}>{st.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {serviceType === 'jobs' && (
        jobs.length === 0 ? <EmptyState icon={<Briefcase size={48} color={Colors.neutral.border} />} title={t('common.noData')} /> :
        jobs.map((job) => (
          <Card key={job.id} style={styles.landCard}>
            <View style={styles.landTop}>
              <View style={[styles.landImg, styles.placeholder]}><Briefcase size={20} color={Colors.neutral.light} /></View>
              <View style={styles.landInfo}>
                <Text style={styles.landName} numberOfLines={1}>{job.title}</Text>
                <Text style={styles.landLoc}>{job.wilaya} - {job.commune}</Text>
                <Text style={styles.reportDate}>{new Date(job.created_at).toLocaleDateString('ar-DZ')}</Text>
              </View>
              <Badge label={t('status.pending')} variant="warning" />
            </View>
            <View style={styles.landActions}>
              <TouchableOpacity onPress={() => approveJob(job.id)} style={styles.actionBtnApprove}>
                <Check size={16} color={Colors.success.main} />
                <Text style={styles.actionTextApprove}>{t('admin.approve')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => rejectJob(job.id)} style={styles.actionBtnReject}>
                <X size={16} color={Colors.error.main} />
                <Text style={styles.actionTextReject}>{t('admin.reject')}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}

      {serviceType === 'ads' && (
        ads.length === 0 ? <EmptyState icon={<Megaphone size={48} color={Colors.neutral.border} />} title={t('common.noData')} /> :
        ads.map((ad) => (
          <Card key={ad.id} style={styles.landCard}>
            <View style={styles.landTop}>
              <View style={[styles.landImg, styles.placeholder]}><Megaphone size={20} color={Colors.neutral.light} /></View>
              <View style={styles.landInfo}>
                <Text style={styles.landName} numberOfLines={1}>{ad.title}</Text>
                <Text style={styles.landLoc}>{ad.wilaya}</Text>
                <Text style={styles.reportDate}>{new Date(ad.created_at).toLocaleDateString('ar-DZ')}</Text>
              </View>
              <Badge label={t('status.pending')} variant="warning" />
            </View>
            <View style={styles.landActions}>
              <TouchableOpacity onPress={() => approveAd(ad.id)} style={styles.actionBtnApprove}>
                <Check size={16} color={Colors.success.main} />
                <Text style={styles.actionTextApprove}>{t('admin.approve')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => rejectAd(ad.id)} style={styles.actionBtnReject}>
                <X size={16} color={Colors.error.main} />
                <Text style={styles.actionTextReject}>{t('admin.reject')}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}

      {serviceType === 'insurance' && (
        insurance.length === 0 ? <EmptyState icon={<ShieldCheck size={48} color={Colors.neutral.border} />} title={t('common.noData')} /> :
        insurance.map((ins) => (
          <Card key={ins.id} style={styles.landCard}>
            <View style={styles.landTop}>
              <View style={[styles.landImg, styles.placeholder]}><ShieldCheck size={20} color={Colors.neutral.light} /></View>
              <View style={styles.landInfo}>
                <Text style={styles.landName} numberOfLines={1}>{t(`insuranceType.${ins.insurance_type.toLowerCase().replace('_', '')}`)}</Text>
                <Text style={styles.landLoc}>{ins.wilaya}</Text>
                <Text style={styles.reportDate}>{new Date(ins.created_at).toLocaleDateString('ar-DZ')}</Text>
              </View>
              <Badge label={t('status.pending')} variant="warning" />
            </View>
            <View style={styles.landActions}>
              <TouchableOpacity onPress={() => reviewInsurance(ins.id)} style={styles.actionBtnApprove}>
                <Check size={16} color={Colors.success.main} />
                <Text style={styles.actionTextApprove}>{t('status.underReview')}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}
    </View>
  );
}

function ContentTab() {
  const { t, locale } = useI18n();
  const { show } = useToast();
  const [subTab, setSubTab] = useState<'about' | 'legal' | 'contactInfo' | 'inbox' | 'social' | 'ai'>('about');
  const [aboutText, setAboutText] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [privacyContent, setPrivacyContent] = useState('');
  const [termsContent, setTermsContent] = useState('');
  const [editingLegal, setEditingLegal] = useState<'PRIVACY_POLICY' | 'TERMS_AND_STANDARDS' | null>(null);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyMsg, setReplyMsg] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [newPlatform, setNewPlatform] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [faqEntries, setFaqEntries] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any[]>([]);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newFaqCategory, setNewFaqCategory] = useState('general');
  const [loading, setLoading] = useState(true);

  const loadAbout = useCallback(async () => {
    const { data } = await supabase.from('site_content').select('key, value').in('key', [`about_${locale}`, 'contact_email', 'contact_phone', `contact_address_${locale}`]);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((r: any) => { map[r.key] = r.value; });
      setAboutText(map[`about_${locale}`] || '');
      setContactEmail(map['contact_email'] || '');
      setContactPhone(map['contact_phone'] || '');
      setContactAddress(map[`contact_address_${locale}`] || '');
    }
  }, [locale]);

  const loadLegal = useCallback(async () => {
    const { data: priv } = await supabase.from('legal_documents').select('content').eq('document_type', 'PRIVACY_POLICY').eq('locale', locale).maybeSingle();
    if (priv) setPrivacyContent(priv.content || '');
    const { data: terms } = await supabase.from('legal_documents').select('content').eq('document_type', 'TERMS_AND_STANDARDS').eq('locale', locale).maybeSingle();
    if (terms) setTermsContent(terms.content || '');
  }, [locale]);

  const loadMessages = useCallback(async () => {
    const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(50);
    if (!error && data) setMessages(data);
  }, []);

  const loadSocial = useCallback(async () => {
    const { data, error } = await supabase.from('social_links').select('*').order('display_order', { ascending: true });
    if (!error && data) setSocialLinks(data);
  }, []);

  const loadFaq = useCallback(async () => {
    const { data, error } = await supabase.from('ai_knowledge').select('*').order('display_order', { ascending: true }).limit(100);
    if (!error && data) setFaqEntries(data);
  }, []);

  const loadUsage = useCallback(async () => {
    const { data, error } = await supabase.from('ai_usage_stats').select('*').order('date', { ascending: false }).limit(30);
    if (!error && data) setUsageStats(data);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadAbout(), loadLegal(), loadMessages(), loadSocial(), loadFaq(), loadUsage()]).then(() => setLoading(false));
  }, [loadAbout, loadLegal, loadMessages, loadSocial, loadFaq, loadUsage]);

  const saveAbout = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: `about_${locale}`, value: aboutText },
        { key: 'contact_email', value: contactEmail },
        { key: 'contact_phone', value: contactPhone },
        { key: `contact_address_${locale}`, value: contactAddress },
      ];
      for (const u of updates) {
        await supabase.from('site_content').upsert({ key: u.key, value: u.value }, { onConflict: 'key' });
      }
      show(t('admin.contentSaved'), 'success');
    } catch {
      show(t('admin.contentSaveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveLegal = async (docType: 'PRIVACY_POLICY' | 'TERMS_AND_STANDARDS', content: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('legal_documents').upsert({ document_type: docType, locale, content }, { onConflict: 'document_type,locale' });
      if (error) throw error;
      show(t('admin.contentSaved'), 'success');
      setEditingLegal(null);
    } catch {
      show(t('admin.contentSaveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateMessageStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id);
    if (error) { show(t('common.error'), 'error'); }
    else { show(t('common.success'), 'success'); loadMessages(); }
  };

  const sendReply = async (id: string) => {
    if (!replyText.trim()) return;
    const { error } = await supabase.from('contact_messages').update({ admin_reply: replyText.trim(), status: 'PENDING' }).eq('id', id);
    if (error) { show(t('common.error'), 'error'); }
    else { show(t('common.success'), 'success'); setReplyMsg(null); setReplyText(''); loadMessages(); }
  };

  const toggleSocial = async (id: string, enabled: boolean) => {
    const { error } = await supabase.from('social_links').update({ is_enabled: !enabled }).eq('id', id);
    if (error) { show(t('common.error'), 'error'); }
    else { loadSocial(); }
  };

  const deleteSocial = async (id: string) => {
    const { error } = await supabase.from('social_links').delete().eq('id', id);
    if (error) { show(t('common.error'), 'error'); }
    else { show(t('common.success'), 'success'); loadSocial(); }
  };

  const addSocial = async () => {
    if (!newPlatform.trim() || !newUrl.trim()) { show(t('auth.fillAllFields'), 'error'); return; }
    const { error } = await supabase.from('social_links').insert({ platform: newPlatform.trim(), url: newUrl.trim(), display_name: newDisplayName.trim() || null, is_enabled: true, display_order: socialLinks.length });
    if (error) { show(t('common.error'), 'error'); }
    else { show(t('common.success'), 'success'); setShowAddSocial(false); setNewPlatform(''); setNewUrl(''); setNewDisplayName(''); loadSocial(); }
  };

  if (loading) return <LoadingState />;

  const contentSubTabs: { key: typeof subTab; label: string }[] = [
    { key: 'about', label: t('admin.editAbout') },
    { key: 'legal', label: t('admin.editContent') },
    { key: 'contactInfo', label: t('admin.editContactInfo') },
    { key: 'inbox', label: t('admin.contactInbox') },
    { key: 'social', label: t('admin.socialLinks') },
    { key: 'ai', label: t('admin.aiKnowledge') },
  ];

  return (
    <View style={styles.listSection}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {contentSubTabs.map((st) => (
          <TouchableOpacity key={st.key} onPress={() => setSubTab(st.key)} style={[styles.subTab, subTab === st.key && styles.subTabActive]}>
            <Text style={[styles.subTabText, subTab === st.key && styles.subTabTextActive]}>{st.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {subTab === 'about' && (
        <Card style={{ gap: 10 }}>
          <Text style={styles.adminLabel}>{t('admin.editAbout')} ({locale})</Text>
          <TextInput style={[styles.adminInput, styles.adminTextArea]} value={aboutText} onChangeText={setAboutText} multiline numberOfLines={8} textAlignVertical="top" />
          <TouchableOpacity style={[styles.actionBtnApprove, { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10 }]} onPress={saveAbout} disabled={saving}>
            <Check size={16} color={Colors.success.main} />
            <Text style={styles.actionTextApprove}>{saving ? t('common.loading') : t('admin.saveContent')}</Text>
          </TouchableOpacity>
        </Card>
      )}

      {subTab === 'legal' && (
        <View style={{ gap: 12 }}>
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.adminLabel}>{t('privacy.title')} ({locale})</Text>
              <TouchableOpacity onPress={() => setEditingLegal('PRIVACY_POLICY')}>
                <Edit3 size={18} color={Colors.primary.main} />
              </TouchableOpacity>
            </View>
            {editingLegal === 'PRIVACY_POLICY' ? (
              <>
                <TextInput style={[styles.adminInput, styles.adminTextArea]} value={privacyContent} onChangeText={setPrivacyContent} multiline numberOfLines={12} textAlignVertical="top" />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={[styles.actionBtnApprove, { paddingHorizontal: 16, paddingVertical: 10 }]} onPress={() => saveLegal('PRIVACY_POLICY', privacyContent)} disabled={saving}>
                    <Check size={16} color={Colors.success.main} />
                    <Text style={styles.actionTextApprove}>{saving ? t('common.loading') : t('admin.saveContent')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtnReject, { paddingHorizontal: 16, paddingVertical: 10 }]} onPress={() => setEditingLegal(null)}>
                    <X size={16} color={Colors.error.main} />
                    <Text style={styles.actionTextReject}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.legalPreview} numberOfLines={5}>{privacyContent}</Text>
            )}
          </Card>
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.adminLabel}>{t('terms.title')} ({locale})</Text>
              <TouchableOpacity onPress={() => setEditingLegal('TERMS_AND_STANDARDS')}>
                <Edit3 size={18} color={Colors.primary.main} />
              </TouchableOpacity>
            </View>
            {editingLegal === 'TERMS_AND_STANDARDS' ? (
              <>
                <TextInput style={[styles.adminInput, styles.adminTextArea]} value={termsContent} onChangeText={setTermsContent} multiline numberOfLines={12} textAlignVertical="top" />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={[styles.actionBtnApprove, { paddingHorizontal: 16, paddingVertical: 10 }]} onPress={() => saveLegal('TERMS_AND_STANDARDS', termsContent)} disabled={saving}>
                    <Check size={16} color={Colors.success.main} />
                    <Text style={styles.actionTextApprove}>{saving ? t('common.loading') : t('admin.saveContent')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtnReject, { paddingHorizontal: 16, paddingVertical: 10 }]} onPress={() => setEditingLegal(null)}>
                    <X size={16} color={Colors.error.main} />
                    <Text style={styles.actionTextReject}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.legalPreview} numberOfLines={5}>{termsContent}</Text>
            )}
          </Card>
        </View>
      )}

      {subTab === 'contactInfo' && (
        <Card style={{ gap: 10 }}>
          <Text style={styles.adminLabel}>{t('admin.editContactInfo')}</Text>
          <TextInput style={styles.adminInput} placeholder={t('admin.contactEmail')} placeholderTextColor={Colors.neutral.light} value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" />
          <TextInput style={styles.adminInput} placeholder={t('admin.contactPhone')} placeholderTextColor={Colors.neutral.light} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
          <TextInput style={styles.adminInput} placeholder={t('admin.contactAddress')} placeholderTextColor={Colors.neutral.light} value={contactAddress} onChangeText={setContactAddress} />
          <TouchableOpacity style={[styles.actionBtnApprove, { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10 }]} onPress={saveAbout} disabled={saving}>
            <Check size={16} color={Colors.success.main} />
            <Text style={styles.actionTextApprove}>{saving ? t('common.loading') : t('admin.saveContent')}</Text>
          </TouchableOpacity>
        </Card>
      )}

      {subTab === 'inbox' && (
        messages.length === 0 ? <EmptyState icon={<Mail size={48} color={Colors.neutral.border} />} title={t('admin.noMessages')} /> :
        messages.map((msg) => (
          <Card key={msg.id} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Mail size={16} color={Colors.primary.main} />
              <Text style={styles.reportType}>{msg.subject}</Text>
              <Badge label={msg.status === 'NEW' ? t('status.pending') : msg.status === 'PENDING' ? t('status.underReview') : msg.status === 'RESOLVED' ? t('reportStatus.resolved') : t('insuranceStatus.closed')} variant={msg.status === 'NEW' ? 'warning' : msg.status === 'RESOLVED' ? 'success' : 'neutral'} />
            </View>
            <Text style={styles.reportDesc}>{msg.message}</Text>
            <Text style={styles.reportDate}>{msg.name} - {msg.email} - {new Date(msg.created_at).toLocaleDateString('ar-DZ')}</Text>
            {msg.admin_reply && <Text style={[styles.reportDesc, { color: Colors.success.main, marginTop: 4 }]}>{t('admin.reply')}: {msg.admin_reply}</Text>}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <TouchableOpacity onPress={() => setReplyMsg(msg)} style={styles.actionBtnApprove}>
                <Text style={styles.actionTextApprove}>{t('admin.reply')}</Text>
              </TouchableOpacity>
              {msg.status !== 'RESOLVED' && (
                <TouchableOpacity onPress={() => updateMessageStatus(msg.id, 'RESOLVED')} style={styles.actionBtnApprove}>
                  <Check size={14} color={Colors.success.main} />
                  <Text style={styles.actionTextApprove}>{t('admin.markResolved')}</Text>
                </TouchableOpacity>
              )}
              {msg.status === 'NEW' && (
                <TouchableOpacity onPress={() => updateMessageStatus(msg.id, 'PENDING')} style={styles.actionBtnInfo}>
                  <Text style={styles.actionTextInfo}>{t('admin.markPending')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ))
      )}

      {subTab === 'social' && (
        <View style={{ gap: 12 }}>
          <TouchableOpacity style={[styles.actionBtnApprove, { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10 }]} onPress={() => setShowAddSocial(true)}>
            <Plus size={16} color={Colors.success.main} />
            <Text style={styles.actionTextApprove}>{t('admin.addSocialLink')}</Text>
          </TouchableOpacity>
          {socialLinks.length === 0 ? <EmptyState icon={<Globe size={48} color={Colors.neutral.border} />} title={t('social.noLinks')} /> :
            socialLinks.map((link) => (
              <Card key={link.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <Globe size={16} color={Colors.primary.main} />
                  <Text style={styles.reportType}>{link.display_name || link.platform}</Text>
                  <Badge label={link.is_enabled ? t('admin.enabled') : t('admin.disabled')} variant={link.is_enabled ? 'success' : 'neutral'} />
                </View>
                <Text style={styles.reportDesc} numberOfLines={1}>{link.url}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <TouchableOpacity onPress={() => toggleSocial(link.id, link.is_enabled)} style={styles.actionBtnApprove}>
                    <Text style={styles.actionTextApprove}>{link.is_enabled ? t('admin.disabled') : t('admin.enabled')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteSocial(link.id)} style={styles.actionBtnReject}>
                    <Trash2 size={14} color={Colors.error.main} />
                    <Text style={styles.actionTextReject}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          }
        </View>
      )}

      {subTab === 'ai' && (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {usageStats.length > 0 && (() => {
              const totals = usageStats.reduce((acc, s) => ({
                total: acc.total + (s.total_requests || 0),
                success: acc.success + (s.successful_requests || 0),
                failed: acc.failed + (s.failed_requests || 0),
              }), { total: 0, success: 0, failed: 0 });
              return (
                <Card style={{ gap: 8, paddingVertical: 14, width: '100%' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <BarChart3 size={18} color={Colors.primary.main} />
                    <Text style={styles.adminLabel}>{t('admin.aiUsage')}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                    <View style={{ flex: 1, minWidth: 90, backgroundColor: Colors.primary.bg, borderRadius: 8, padding: 10 }}>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.primary.main, fontFamily: 'System' }}>{totals.total}</Text>
                      <Text style={{ fontSize: 12, color: Colors.neutral.textMuted, fontFamily: 'System' }}>{t('admin.aiRequests')}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 90, backgroundColor: Colors.success.bg, borderRadius: 8, padding: 10 }}>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.success.main, fontFamily: 'System' }}>{totals.success}</Text>
                      <Text style={{ fontSize: 12, color: Colors.neutral.textMuted, fontFamily: 'System' }}>{t('admin.aiSuccessful')}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 90, backgroundColor: Colors.error.bg, borderRadius: 8, padding: 10 }}>
                      <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.error.main, fontFamily: 'System' }}>{totals.failed}</Text>
                      <Text style={{ fontSize: 12, color: Colors.neutral.textMuted, fontFamily: 'System' }}>{t('admin.aiFailed')}</Text>
                    </View>
                  </View>
                </Card>
              );
            })()}
          </View>

          <TouchableOpacity style={[styles.actionBtnApprove, { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10 }]} onPress={() => setShowAddFaq(true)}>
            <Plus size={16} color={Colors.success.main} />
            <Text style={styles.actionTextApprove}>{t('admin.addFaq')}</Text>
          </TouchableOpacity>

          {faqEntries.length === 0 ? (
            <EmptyState icon={<Sparkles size={48} color={Colors.neutral.border} />} title={t('common.noData')} />
          ) : (
            faqEntries.map((faq) => (
              <Card key={faq.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <Sparkles size={16} color={Colors.primary.main} />
                  <Text style={styles.reportType} numberOfLines={1}>{faq.question}</Text>
                  <Badge label={faq.is_published ? t('admin.published') : t('admin.unpublished')} variant={faq.is_published ? 'success' : 'neutral'} />
                </View>
                <Text style={styles.reportDesc} numberOfLines={3}>{faq.answer}</Text>
                <Text style={styles.reportDate}>{faq.category} - {faq.locale}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <TouchableOpacity onPress={async () => { await supabase.from('ai_knowledge').update({ is_published: !faq.is_published }).eq('id', faq.id); loadFaq(); }} style={styles.actionBtnApprove}>
                    <Text style={styles.actionTextApprove}>{faq.is_published ? t('admin.unpublished') : t('admin.published')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={async () => { await supabase.from('ai_knowledge').delete().eq('id', faq.id); show(t('common.success'), 'success'); loadFaq(); }} style={styles.actionBtnReject}>
                    <Trash2 size={14} color={Colors.error.main} />
                    <Text style={styles.actionTextReject}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      <Modal visible={!!replyMsg} transparent animationType="slide" onRequestClose={() => setReplyMsg(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('admin.reply')}</Text>
              <TouchableOpacity onPress={() => setReplyMsg(null)}><X size={24} color={Colors.neutral.textMuted} /></TouchableOpacity>
            </View>
            {replyMsg && <Text style={styles.reportDesc}>{replyMsg.subject}: {replyMsg.message}</Text>}
            <TextInput style={[styles.adminInput, styles.adminTextArea]} placeholder={t('admin.replyMessage')} placeholderTextColor={Colors.neutral.light} value={replyText} onChangeText={setReplyText} multiline numberOfLines={4} textAlignVertical="top" />
            <TouchableOpacity style={[styles.actionBtnApprove, { paddingHorizontal: 16, paddingVertical: 12, marginTop: 8 }]} onPress={() => sendReply(replyMsg.id)}>
              <Text style={styles.actionTextApprove}>{t('admin.sendReply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddFaq} transparent animationType="slide" onRequestClose={() => setShowAddFaq(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('admin.addFaq')}</Text>
              <TouchableOpacity onPress={() => setShowAddFaq(false)}><X size={24} color={Colors.neutral.textMuted} /></TouchableOpacity>
            </View>
            <TextInput style={styles.adminInput} placeholder={t('admin.question')} placeholderTextColor={Colors.neutral.light} value={newFaqQuestion} onChangeText={setNewFaqQuestion} />
            <TextInput style={[styles.adminInput, styles.adminTextArea]} placeholder={t('admin.answer')} placeholderTextColor={Colors.neutral.light} value={newFaqAnswer} onChangeText={setNewFaqAnswer} multiline numberOfLines={4} textAlignVertical="top" />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['ar', 'fr', 'en'].map((l) => (
                <TouchableOpacity key={l} onPress={() => setNewFaqCategory(l)} style={[styles.subTab, newFaqCategory === l && styles.subTabActive]}>
                  <Text style={[styles.subTabText, newFaqCategory === l && styles.subTabTextActive]}>{l.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.actionBtnApprove, { paddingHorizontal: 16, paddingVertical: 12, marginTop: 8 }]} onPress={async () => {
              if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) { show(t('auth.fillAllFields'), 'error'); return; }
              const { error } = await supabase.from('ai_knowledge').insert({ question: newFaqQuestion.trim(), answer: newFaqAnswer.trim(), category: 'general', locale: newFaqCategory, is_published: true, display_order: faqEntries.length });
              if (error) { show(t('common.error'), 'error'); }
              else { show(t('common.success'), 'success'); setShowAddFaq(false); setNewFaqQuestion(''); setNewFaqAnswer(''); loadFaq(); }
            }}>
              <Plus size={16} color={Colors.success.main} />
              <Text style={styles.actionTextApprove}>{t('admin.addFaq')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddSocial} transparent animationType="slide" onRequestClose={() => setShowAddSocial(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('admin.addSocialLink')}</Text>
              <TouchableOpacity onPress={() => setShowAddSocial(false)}><X size={24} color={Colors.neutral.textMuted} /></TouchableOpacity>
            </View>
            <TextInput style={styles.adminInput} placeholder={t('admin.platform')} placeholderTextColor={Colors.neutral.light} value={newPlatform} onChangeText={setNewPlatform} />
            <TextInput style={styles.adminInput} placeholder={t('admin.url')} placeholderTextColor={Colors.neutral.light} value={newUrl} onChangeText={setNewUrl} keyboardType="url" />
            <TextInput style={styles.adminInput} placeholder={t('admin.displayName')} placeholderTextColor={Colors.neutral.light} value={newDisplayName} onChangeText={setNewDisplayName} />
            <TouchableOpacity style={[styles.actionBtnApprove, { paddingHorizontal: 16, paddingVertical: 12, marginTop: 8 }]} onPress={addSocial}>
              <Plus size={16} color={Colors.success.main} />
              <Text style={styles.actionTextApprove}>{t('admin.addSocialLink')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.primary.dark },
  backBtn: { padding: 4 },
  backText: { fontSize: 16, color: Colors.neutral.white, fontWeight: '600', fontFamily: 'System' },
  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.neutral.white, flex: 1, fontFamily: 'System' },
  tabs: { flexDirection: 'row', backgroundColor: Colors.neutral.white, paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.neutral.borderLight },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: Colors.neutral.surface },
  tabActive: { backgroundColor: Colors.primary.bg, borderWidth: 1, borderColor: Colors.primary.border },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.neutral.textMuted, fontFamily: 'System' },
  tabTextActive: { color: Colors.primary.main },
  body: { flex: 1, padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '47%', alignItems: 'center', gap: 8, paddingVertical: 16 },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 28, fontWeight: '800', color: Colors.neutral.text, fontFamily: 'System' },
  statLabel: { fontSize: 12, color: Colors.neutral.textMuted, textAlign: 'center', fontFamily: 'System' },
  listSection: { gap: 12 },
  landCard: { gap: 10 },
  landTop: { flexDirection: 'row', gap: 10 },
  landImg: { width: 64, height: 64, borderRadius: 10 },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.neutral.surface },
  landInfo: { flex: 1, gap: 2 },
  landName: { fontSize: 15, fontWeight: '700', color: Colors.neutral.text, fontFamily: 'System' },
  landLoc: { fontSize: 13, color: Colors.neutral.textMuted, fontFamily: 'System' },
  landArea: { fontSize: 13, color: Colors.primary.main, fontWeight: '600', fontFamily: 'System' },
  landActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: Colors.neutral.borderLight, paddingTop: 8 },
  actionBtnApprove: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.success.bg },
  actionTextApprove: { fontSize: 12, fontWeight: '600', color: Colors.success.main, fontFamily: 'System' },
  actionBtnReject: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.error.bg },
  actionTextReject: { fontSize: 12, fontWeight: '600', color: Colors.error.main, fontFamily: 'System' },
  actionBtnInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.warning.bg },
  actionTextInfo: { fontSize: 12, fontWeight: '600', color: Colors.warning.main, fontFamily: 'System' },
  userCard: { gap: 8 },
  userTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary.bg, alignItems: 'center', justifyContent: 'center' },
  userInitial: { fontSize: 18, fontWeight: '700', color: Colors.primary.main, fontFamily: 'System' },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 15, fontWeight: '700', color: Colors.neutral.text, fontFamily: 'System' },
  userPhone: { fontSize: 13, color: Colors.neutral.textMuted, fontFamily: 'System' },
  userWilaya: { fontSize: 13, color: Colors.neutral.textMuted, fontFamily: 'System' },
  userBadges: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' },
  reportCard: { gap: 8 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reportType: { fontSize: 14, fontWeight: '600', color: Colors.neutral.text, flex: 1, fontFamily: 'System' },
  reportDesc: { fontSize: 13, color: Colors.neutral.textLight, fontFamily: 'System' },
  reportDate: { fontSize: 12, color: Colors.neutral.light, fontFamily: 'System' },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  resolveText: { fontSize: 13, fontWeight: '600', color: Colors.success.main, fontFamily: 'System' },
  subTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.neutral.surface },
  subTabActive: { backgroundColor: Colors.primary.bg, borderWidth: 1, borderColor: Colors.primary.border },
  subTabText: { fontSize: 13, fontWeight: '600', color: Colors.neutral.textMuted, fontFamily: 'System' },
  subTabTextActive: { color: Colors.primary.main },
  adminLabel: { fontSize: 14, fontWeight: '600', color: Colors.neutral.text, fontFamily: 'System' },
  adminInput: { backgroundColor: Colors.neutral.surface, borderWidth: 1.5, borderColor: Colors.neutral.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: Colors.neutral.text, fontFamily: 'System' },
  adminTextArea: { minHeight: 120, textAlignVertical: 'top' as any },
  legalPreview: { fontSize: 13, color: Colors.neutral.textMuted, lineHeight: 20, fontFamily: 'System' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { backgroundColor: Colors.neutral.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.neutral.text, fontFamily: 'System' },
});
