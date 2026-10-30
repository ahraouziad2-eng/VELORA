import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { Facebook, Instagram, Youtube, Linkedin, MessageCircle, Music2, Link as LinkIcon } from 'lucide-react-native';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  display_name: string | null;
  icon_name: string | null;
  display_order: number;
  is_enabled: boolean;
}

const iconMap: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  whatsapp: MessageCircle,
  tiktok: Music2,
};

export function SocialLinksBar() {
  const { t } = useI18n();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('social_links')
        .select('id, platform, url, display_name, icon_name, display_order, is_enabled')
        .eq('is_enabled', true)
        .order('display_order', { ascending: true });
      if (!error && data) {
        setLinks(data as SocialLink[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openLink = async (url: string) => {
    try {
      const validUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      await Linking.openURL(validUrl);
    } catch {
      // silent
    }
  };

  if (loading) {
    return <ActivityIndicator size="small" color={Colors.primary.main} />;
  }

  if (links.length === 0) {
    return <Text style={styles.emptyText}>{t('social.noLinks')}</Text>;
  }

  return (
    <View style={styles.container}>
      {links.map((link) => {
        const Icon = iconMap[link.platform.toLowerCase()] || LinkIcon;
        const label = link.display_name || link.platform.charAt(0).toUpperCase() + link.platform.slice(1);
        return (
          <TouchableOpacity key={link.id} style={styles.linkBtn} onPress={() => openLink(link.url)} activeOpacity={0.7}>
            <Icon size={22} color={Colors.primary.main} />
            <Text style={styles.linkText}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.neutral.surface, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: Colors.neutral.border },
  linkText: { fontSize: 13, fontWeight: '600', color: Colors.neutral.text, fontFamily: 'System' },
  emptyText: { fontSize: 13, color: Colors.neutral.light, fontFamily: 'System', textAlign: 'center' },
});
