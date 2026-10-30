import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, Send, RefreshCw, MoreVertical, Plus, Trash2, Copy, ThumbsUp, ThumbsDown, UserRound, Sprout, Tractor, Wrench, Handshake, Briefcase } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { BrandLogo } from '@/components/BrandLogo';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

type Suggestion = {
  label: string;
  icon: ReactNode;
};

const arabicSuggestions: Suggestion[] = [
  { label: 'كيف أنشئ حساباً؟', icon: <UserRound size={15} color="#1B5E45" /> },
  { label: 'كيف أضيف أرضاً؟', icon: <Sprout size={15} color="#1B5E45" /> },
  { label: 'ما هي خدمات VELORA؟', icon: <Wrench size={15} color="#1B5E45" /> },
  { label: 'كيف أكري معداتي؟', icon: <Tractor size={15} color="#1B5E45" /> },
  { label: 'كيف أجد شريكاً فلاحياً؟', icon: <Handshake size={15} color="#1B5E45" /> },
  { label: 'كيف أتقدم لوظيفة؟', icon: <Briefcase size={15} color="#1B5E45" /> },
];

const fallbackSuggestions: Record<string, string[]> = {
  fr: ['Comment créer un compte ?', 'Comment ajouter un terrain ?', 'Quels sont les services de VELORA ?', 'Comment postuler à un emploi ?'],
  en: ['How do I create an account?', 'How do I add a land listing?', 'What services does VELORA offer?', 'How do I apply for a job?'],
};

function FormattedMessage({ content, isError }: { content: string; isError?: boolean }) {
  const lines = content.split('\n');
  const inlinePattern = /(\*\*.*?\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/\S+)/g;
  const renderInline = (line: string) => line.split(inlinePattern).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <Text key={index} style={styles.boldText}>{part.slice(2, -2)}</Text>;
    const markdownLink = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (markdownLink) return <Text key={index} style={styles.linkText} onPress={() => window.open(markdownLink[2], '_self')}>{markdownLink[1]}</Text>;
    if (part.startsWith('http://') || part.startsWith('https://')) return <Text key={index} style={styles.linkText} onPress={() => window.open(part, '_self')}>{part}</Text>;
    return part;
  });

  return (
    <Text style={[styles.msgText, styles.assistantText, isError && styles.errorText]}>
      {lines.map((line, index) => {
        const isBullet = /^[-*•]\s/.test(line);
        const cleanLine = isBullet ? line.replace(/^[-*•]\s/, '') : line;
        return <Text key={`${line}-${index}`}>{isBullet ? <Text style={styles.bulletText}>• </Text> : null}{renderInline(cleanLine)}{index < lines.length - 1 ? '\n' : ''}</Text>;
      })}
    </Text>
  );
}

export default function AIChatScreen() {
  const { session } = useAuth();
  const { t, locale } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const welcomeMessages: Record<string, string> = {
    ar: 'مرحبًا بك في VELORA AI! أنا مساعدك الافتراضي. كيف يمكنني مساعدتك اليوم؟',
    fr: 'Bienvenue sur VELORA AI ! Je suis votre assistant virtuel. Comment puis-je vous aider aujourd\'hui ?',
    en: 'Welcome to VELORA AI! I\'m your virtual assistant. How can I help you today?',
  };

  useEffect(() => {
    setMessages([{ role: 'assistant', content: welcomeMessages[locale] || welcomeMessages.ar }]);
  }, [locale]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const sendMessage = async (text: string, isRetry = false) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setInput('');

    const userMessage: Message = { role: 'user', content: trimmed };
    const newMessages = isRetry ? [...messages] : [...messages, userMessage];
    if (!isRetry) setMessages(newMessages);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/velora-ai`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          locale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || t('ai.errorGeneric');
        setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg, isError: true }]);
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: t('ai.errorNetwork'), isError: true }]);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      const withoutLastError = messages.filter((m, i) => !(m.isError && i === messages.length - 1));
      setMessages(withoutLastError);
      sendMessage(lastUserMsg.content, true);
    }
  };

  const handleSuggested = (question: string) => {
    sendMessage(question);
  };

  const clearConversation = () => {
    setMessages([{ role: 'assistant', content: welcomeMessages[locale] || welcomeMessages.ar }]);
    setInput('');
    setMenuVisible(false);
  };

  const newConversation = () => {
    clearConversation();
    scrollToBottom();
  };

  const copyMessage = async (content: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(content);
    }
  };

  const handleInputKeyPress = (event: any) => {
    if (Platform.OS === 'web' && event.nativeEvent?.key === 'Enter' && !event.nativeEvent?.shiftKey) {
      event.preventDefault?.();
      sendMessage(input);
    }
  };

  const suggestions = locale === 'ar'
    ? arabicSuggestions
    : (fallbackSuggestions[locale] || fallbackSuggestions.en).map((label) => ({ label, icon: <Sprout size={15} color="#1B5E45" /> }));
  const hasConversation = messages.some((message) => message.role === 'user');
  const showFollowUps = hasConversation && !sending && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.isError;

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.shell}>
        <LinearGradient colors={['#1B5E45', '#14503A']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.header}>
          <View style={styles.headerSide}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton} accessibilityLabel="رجوع">
              <ChevronLeft size={23} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.botAvatarLarge}>
              <BrandLogo variant="mark" size={27} />
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>مساعد VELORA الذكي</Text>
              <Text style={styles.headerSubtitle}>متصل الآن · يرد خلال ثوانٍ</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerButton} accessibilityLabel="خيارات المحادثة">
            <MoreVertical size={23} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
        >
          {!hasConversation && (
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeAvatar}><BrandLogo variant="mark" size={48} /></View>
              <Text style={styles.welcomeTitle}>مرحباً بك في VELORA AI</Text>
              <Text style={styles.welcomeText}>اسألني عن الأراضي والمعدات والخدمات الفلاحية وطريقة استعمال المنصة</Text>
            </View>
          )}

          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isWelcome = !hasConversation && index === 0;
            if (isWelcome) return null;
            return (
              <View key={`${msg.role}-${index}`} style={[styles.messageGroup, isUser ? styles.messageGroupUser : styles.messageGroupAssistant]}>
                <View style={[styles.messageLine, isUser && styles.messageLineUser]}>
                  {!isUser && <View style={styles.botAvatarSmall}><BrandLogo variant="mark" size={17} /></View>}
                  <View style={[styles.msgBubble, isUser ? styles.userBubble : styles.assistantBubble, msg.isError && styles.errorBubble]}>
                    {isUser ? <Text style={[styles.msgText, styles.userText]}>{msg.content}</Text> : <FormattedMessage content={msg.content} isError={msg.isError} />}
                    {msg.isError && <TouchableOpacity style={styles.retryInline} onPress={handleRetry}><RefreshCw size={14} color="#A33A32" /><Text style={styles.retryInlineText}>إعادة المحاولة</Text></TouchableOpacity>}
                  </View>
                </View>
                <View style={[styles.metaRow, isUser && styles.metaRowUser]}>
                  <Text style={styles.timeText}>{new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}</Text>
                  {!isUser && !msg.isError && (
                    <View style={styles.messageActions}>
                      <TouchableOpacity onPress={() => copyMessage(msg.content)}><Copy size={14} color="#8A948D" /></TouchableOpacity>
                      <TouchableOpacity><ThumbsUp size={14} color="#8A948D" /></TouchableOpacity>
                      <TouchableOpacity><ThumbsDown size={14} color="#8A948D" /></TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {sending && (
            <View style={[styles.messageGroup, styles.messageGroupAssistant]}>
              <View style={styles.messageLine}>
                <View style={styles.botAvatarSmall}><BrandLogo variant="mark" size={17} /></View>
                <View style={[styles.msgBubble, styles.assistantBubble, styles.typingBubble]}>
                  <View style={styles.typingDots}><View style={styles.typingDot} /><View style={styles.typingDot} /><View style={styles.typingDot} /></View>
                  <Text style={styles.typingText}>يكتب...</Text>
                </View>
              </View>
            </View>
          )}

          {!sending && !hasConversation && (
            <View style={styles.suggestionsWrap}>
              <Text style={styles.suggestionsTitle}>جرّب أن تسألني</Text>
              <View style={styles.chipsWrap}>{suggestions.map((suggestion) => <TouchableOpacity key={suggestion.label} style={styles.suggestionChip} onPress={() => handleSuggested(suggestion.label)}>{suggestion.icon}<Text style={styles.suggestionText}>{suggestion.label}</Text></TouchableOpacity>)}</View>
            </View>
          )}

          {showFollowUps && (
            <View style={styles.suggestionsWrap}>
              <Text style={styles.suggestionsTitle}>اقتراحات متابعة</Text>
              <View style={styles.chipsWrap}>{suggestions.slice(0, 4).map((suggestion) => <TouchableOpacity key={`follow-${suggestion.label}`} style={styles.suggestionChip} onPress={() => handleSuggested(suggestion.label)}>{suggestion.icon}<Text style={styles.suggestionText}>{suggestion.label}</Text></TouchableOpacity>)}</View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="اكتب سؤالك هنا..."
              placeholderTextColor="#8A948D"
              value={input}
              onChangeText={setInput}
              onKeyPress={handleInputKeyPress}
              onSubmitEditing={() => Platform.OS !== 'web' && sendMessage(input)}
              multiline
              maxLength={2000}
              editable={!sending}
            />
            <TouchableOpacity style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]} onPress={() => sendMessage(input)} disabled={!input.trim() || sending} activeOpacity={0.75}>
              {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Send size={20} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
          <Text style={styles.disclaimer}>قد يخطئ المساعد أحياناً، تحقق من المعلومات المهمة</Text>
        </View>
      </View>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={newConversation}><Plus size={18} color="#1B5E45" /><Text style={styles.menuText}>محادثة جديدة</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={clearConversation}><Trash2 size={18} color="#A33A32" /><Text style={[styles.menuText, styles.deleteText]}>مسح المحادثة</Text></TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FAF8F1' },
  shell: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', backgroundColor: '#FAF8F1', overflow: 'hidden', borderRadius: 24, shadowColor: '#1F2A24', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 6 },
  header: { minHeight: 92, paddingTop: 'calc(14px + env(safe-area-inset-top))' as any, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: '#1B5E45', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerSide: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,.12)' },
  botAvatarLarge: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#C9942E', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  onlineDot: { position: 'absolute', right: -1, bottom: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#7BCB91', borderWidth: 2, borderColor: '#1B5E45' },
  headerTextWrap: { flex: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', fontFamily: 'Cairo', textAlign: 'right' },
  headerSubtitle: { color: '#B7E0C1', fontSize: 11, marginTop: 2, fontFamily: 'Cairo', textAlign: 'right' },
  chatArea: { flex: 1 },
  chatContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, gap: 14 },
  welcomeCard: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,.72)', borderWidth: 1, borderColor: '#EAE4D3', borderRadius: 22, paddingHorizontal: 22, paddingVertical: 22, shadowColor: '#1F2A24', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  welcomeAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#C9942E', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  welcomeTitle: { color: '#1B5E45', fontSize: 22, lineHeight: 32, fontWeight: '800', fontFamily: 'Cairo', textAlign: 'center' },
  welcomeText: { color: '#5F6B64', fontSize: 14, lineHeight: 24, marginTop: 5, fontFamily: 'IBMPlexSansArabic, Cairo', textAlign: 'center' },
  messageGroup: { maxWidth: '100%' },
  messageGroupAssistant: { alignItems: 'flex-start' },
  messageGroupUser: { alignItems: 'flex-end' },
  messageLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, maxWidth: '82%' },
  messageLineUser: { justifyContent: 'flex-end' },
  botAvatarSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4C879', alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  msgBubble: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: 18, maxWidth: '100%' },
  userBubble: { backgroundColor: '#1B5E45', borderBottomRightRadius: 6 },
  assistantBubble: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAE4D3', borderBottomLeftRadius: 6, shadowColor: '#1F2A24', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  errorBubble: { backgroundColor: '#FFF1EF', borderColor: '#E8B5AE' },
  msgText: { fontSize: 15.5, lineHeight: 28, fontFamily: 'IBMPlexSansArabic, Cairo' },
  userText: { color: '#FFFFFF' },
  assistantText: { color: '#27352D' },
  errorText: { color: '#A33A32' },
  boldText: { fontWeight: '800' },
  bulletText: { color: '#1B5E45', fontWeight: '800' },
  linkText: { color: '#1B5E45', textDecorationLine: 'underline' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 35, marginTop: 3 },
  metaRowUser: { justifyContent: 'flex-end', marginLeft: 0 },
  timeText: { color: '#929B95', fontSize: 10, fontFamily: 'IBMPlexSansArabic, Cairo' },
  messageActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  retryInline: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E8B5AE' },
  retryInlineText: { color: '#A33A32', fontSize: 12, fontWeight: '700', fontFamily: 'Cairo' },
  typingBubble: { minWidth: 94, flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingDots: { flexDirection: 'row', gap: 3 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1B5E45' },
  typingText: { color: '#5F6B64', fontSize: 12, fontFamily: 'Cairo' },
  suggestionsWrap: { marginTop: 2 },
  suggestionsTitle: { color: '#5F6B64', fontSize: 13, fontWeight: '700', marginBottom: 8, fontFamily: 'Cairo', textAlign: 'right' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
  suggestionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#B9D7C2', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  suggestionText: { color: '#1B5E45', fontSize: 12.5, fontFamily: 'Cairo' },
  inputBar: { backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' as any, borderTopWidth: 1, borderTopColor: '#EAE4D3', shadowColor: '#1F2A24', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 5 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
  input: { flex: 1, minHeight: 44, maxHeight: 128, backgroundColor: '#F4F1E8', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, color: '#27352D', fontSize: 15, lineHeight: 24, textAlign: 'right', fontFamily: 'IBMPlexSansArabic, Cairo' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1B5E45', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#AEB8B1' },
  disclaimer: { color: '#929B95', fontSize: 10, marginTop: 6, textAlign: 'center', fontFamily: 'IBMPlexSansArabic, Cairo' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(15,34,24,.2)', alignItems: 'flex-start', paddingTop: 82, paddingHorizontal: 16 },
  menuCard: { width: 190, backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 6, shadowColor: '#1F2A24', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  menuText: { color: '#27352D', fontSize: 13, fontWeight: '700', fontFamily: 'Cairo' },
  deleteText: { color: '#A33A32' },
});
