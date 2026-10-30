import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function ProfileStackLayout() {
  const { session, guestMode } = useAuth();

  if (!session && !guestMode) return <Redirect href="/(auth)/splash" />;
  if (guestMode) return <Redirect href="/(auth)/welcome" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
