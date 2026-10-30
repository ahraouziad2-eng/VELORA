import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/lib/auth';
import { I18nProvider } from '@/lib/i18n';
import { ToastProvider } from '@/components/ui/Toast';

I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <I18nProvider>
        <ToastProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(auth)/welcome" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="land/[id]" />
            <Stack.Screen name="add-land" />
            <Stack.Screen name="messages/[id]" />
            <Stack.Screen name="request/[type]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="report" options={{ presentation: 'modal' }} />
            <Stack.Screen name="legal/request" options={{ presentation: 'modal' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ToastProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
