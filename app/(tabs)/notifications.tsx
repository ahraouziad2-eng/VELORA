import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Bell, CheckCheck, Clock } from 'lucide-react-native';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, title, body, is_read, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setNotifications(data as NotificationRow[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const markAllRead = useCallback(async () => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
      load();
    } catch {
      // silent
    }
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      load();
    } catch {
      // silent
    }
  }, [load]);

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
        {notifications.some((n) => !n.is_read) && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <CheckCheck size={18} color={Colors.primary.main} />
            <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => markRead(item.id)} activeOpacity={0.85}>
            <Card style={[styles.card, !item.is_read ? styles.cardUnread : undefined] as any}>
              <View style={styles.cardHeader}>
                <Bell size={18} color={item.is_read ? Colors.neutral.light : Colors.primary.main} />
                <Text style={styles.cardTitle}>{item.title}</Text>
                {!item.is_read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.cardBody}>{item.body}</Text>
              <View style={styles.cardFooter}>
                <Clock size={12} color={Colors.neutral.light} />
                <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString('ar-DZ')}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.main]} />}
        ListEmptyComponent={<EmptyState icon={<Bell size={48} color={Colors.neutral.border} />} title={t('notifications.empty')} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.neutral.white, borderBottomWidth: 1, borderBottomColor: Colors.neutral.borderLight },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.neutral.text, fontFamily: 'System' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { fontSize: 13, color: Colors.primary.main, fontWeight: '600', fontFamily: 'System' },
  list: { padding: 16, gap: 10 },
  card: { gap: 8 },
  cardUnread: { backgroundColor: Colors.primary.bg, borderColor: Colors.primary.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.neutral.text, flex: 1, fontFamily: 'System' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary.main },
  cardBody: { fontSize: 14, color: Colors.neutral.textLight, fontFamily: 'System' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDate: { fontSize: 12, color: Colors.neutral.light, fontFamily: 'System' },
});
