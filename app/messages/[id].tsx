import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight, Send } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/theme';
import { AccountRequiredModal } from '@/components/ui/AccountRequiredModal';

interface MessageRow {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function MessagesScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user, guestMode } = useAuth();
  const { t } = useI18n();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAccountRequired, setShowAccountRequired] = useState(guestMode);
  const flatListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at, is_read')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data as MessageRow[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const sendMessage = async () => {
    if (!user || !conversationId || !input.trim()) return;
    const text = input.trim();
    setInput('');
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: text,
        is_read: false,
      });

      if (error) throw error;
      loadMessages();
    } catch {
      // silent
    }
  };

  const renderItem = ({ item }: { item: MessageRow }) => {
    const isOwn = item.sender_id === user?.id;
    return (
      <View style={[styles.messageRow, isOwn ? styles.messageOwn : styles.messageOther]}>
        <View style={[styles.messageBubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          <Text style={[styles.messageText, isOwn ? styles.textOwn : styles.textOther]}>{item.content}</Text>
          <Text style={[styles.messageTime, isOwn ? styles.timeOwn : styles.timeOther]}>
            {new Date(item.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container} keyboardVerticalOffset={90}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronRight size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('messaging.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputBar} pointerEvents={guestMode ? 'none' : 'auto'}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={t('messaging.typeMessage')}
          placeholderTextColor={Colors.neutral.light}
          multiline
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn} disabled={!input.trim()}>
          <Send size={20} color={input.trim() ? Colors.neutral.white : Colors.neutral.light} />
        </TouchableOpacity>
      </View>

      <AccountRequiredModal visible={showAccountRequired} onDismiss={() => { setShowAccountRequired(false); router.back(); }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.primary.main },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.neutral.white, fontFamily: 'System' },
  list: { padding: 16, gap: 8 },
  messageRow: { flexDirection: 'row', marginBottom: 4 },
  messageOwn: { justifyContent: 'flex-end' },
  messageOther: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleOwn: { backgroundColor: Colors.primary.main, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: Colors.neutral.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.neutral.borderLight },
  messageText: { fontSize: 15, fontFamily: 'System' },
  textOwn: { color: Colors.neutral.white },
  textOther: { color: Colors.neutral.text },
  messageTime: { fontSize: 10, marginTop: 4, fontFamily: 'System' },
  timeOwn: { color: 'rgba(255,255,255,0.7)' },
  timeOther: { color: Colors.neutral.light },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, paddingBottom: 32, backgroundColor: Colors.neutral.white, borderTopWidth: 1, borderTopColor: Colors.neutral.borderLight },
  input: { flex: 1, minHeight: 40, maxHeight: 100, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.neutral.surface, borderRadius: 20, fontSize: 15, color: Colors.neutral.text, fontFamily: 'System' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary.main, alignItems: 'center', justifyContent: 'center' },
});
