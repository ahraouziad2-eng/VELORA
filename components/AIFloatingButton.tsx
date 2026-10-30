import { useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

export function AIFloatingButton() {
  const { width } = useWindowDimensions();
  const location = useLocation();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const updateKeyboardVisibility = () => {
      const viewport = window.visualViewport;
      setKeyboardVisible(Boolean(viewport && viewport.height < window.innerHeight * 0.75));
    };

    window.addEventListener('resize', updateKeyboardVisibility);
    window.visualViewport?.addEventListener('resize', updateKeyboardVisibility);
    return () => {
      window.removeEventListener('resize', updateKeyboardVisibility);
      window.visualViewport?.removeEventListener('resize', updateKeyboardVisibility);
    };
  }, []);

  if (location.pathname === '/ai-chat' || keyboardVisible) return null;

  return (
    <TouchableOpacity
      style={[styles.fab, width < 768 ? styles.fabMobile : styles.fabDesktop] as any}
      onPress={() => router.push('/ai-chat')}
      activeOpacity={0.8}
      accessibilityLabel="المساعد الذكي"
    >
      <Sparkles size={24} color={Colors.neutral.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'fixed' as any,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 50,
  },
  fabMobile: {
    left: 16,
    bottom: 'calc(80px + env(safe-area-inset-bottom))' as any,
  },
  fabDesktop: {
    left: 24,
    bottom: 24,
  },
});
