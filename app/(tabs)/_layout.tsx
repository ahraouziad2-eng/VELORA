import { Tabs, Redirect } from 'expo-router';
import { Home, Compass, MapPin, FileText, User } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Colors } from '@/constants/colors';
import { LoadingState } from '@/components/ui/LoadingState';

export default function TabsLayout() {
  const { session, guestMode, loading } = useAuth();
  const { t } = useI18n();

  if (loading) return <LoadingState />;
  if (!session && !guestMode) return <Redirect href="/(auth)/splash" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary.main,
        tabBarInactiveTintColor: Colors.neutral.light,
        tabBarStyle: {
          backgroundColor: Colors.neutral.white,
          borderTopColor: Colors.neutral.borderLight,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          fontFamily: 'System',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ size, color }: { size: number; color: string }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('nav.explore'),
          tabBarIcon: ({ size, color }: { size: number; color: string }) => <Compass size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('nav.map'),
          tabBarIcon: ({ size, color }: { size: number; color: string }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: t('nav.requests'),
          tabBarIcon: ({ size, color }: { size: number; color: string }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ size, color }: { size: number; color: string }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
