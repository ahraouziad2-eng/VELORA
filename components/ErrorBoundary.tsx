import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  private goHome = () => {
    window.location.hash = '#/home';
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>حدث خطأ غير متوقع</Text>
        <Text style={styles.text}>تعذر عرض هذه الصفحة. يمكنك العودة إلى الرئيسية والمحاولة مجدداً.</Text>
        <TouchableOpacity onPress={this.goHome} style={styles.button} accessibilityRole="button">
          <Text style={styles.buttonText}>العودة للرئيسية</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: Colors.neutral.white, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.neutral.text, textAlign: 'center', fontFamily: 'System' },
  text: { fontSize: 15, color: Colors.neutral.textMuted, textAlign: 'center', lineHeight: 24, fontFamily: 'System' },
  button: { marginTop: 8, minHeight: 48, paddingHorizontal: 24, borderRadius: 12, backgroundColor: Colors.primary.main, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '700', color: Colors.neutral.white, fontFamily: 'System' },
});
