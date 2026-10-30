import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native-web';
import { Home, Compass, MapPin, FileText, User } from 'lucide-react-native';

import { AuthProvider, useAuth } from '@/lib/auth';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { ToastProvider } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AIFloatingButton } from '@/components/AIFloatingButton';
import { LoadingState } from '@/components/ui/LoadingState';
import { Colors } from '@/constants/colors';
import { ExpoRouterProvider } from './shims/expo-router';

// Screens
import SplashScreen from '@/app/(auth)/splash';
import LoginScreen from '@/app/(auth)/login';
import RegisterScreen from '@/app/(auth)/register';
import ForgotPasswordScreen from '@/app/(auth)/forgot-password';
import ResetPasswordScreen from '@/app/(auth)/reset-password';
import OnboardingScreen from '@/app/(auth)/onboarding';
import WelcomeScreen from '@/app/(auth)/welcome';

import HomeScreen from '@/app/(tabs)/index';
import ExploreScreen from '@/app/(tabs)/explore';
import MapScreen from '@/app/(tabs)/map';
import RequestsScreen from '@/app/(tabs)/requests';
import NotificationsScreen from '@/app/(tabs)/notifications';
import JobsScreen from '@/app/(tabs)/jobs';
import InsuranceScreen from '@/app/(tabs)/insurance';
import AdsScreen from '@/app/(tabs)/ads';

import ProfileScreen from '@/app/(tabs)/profile/index';
import ProfileEditScreen from '@/app/(tabs)/profile/edit';
import ProfileSettingsScreen from '@/app/(tabs)/profile/settings';
import ProfileAboutScreen from '@/app/(tabs)/profile/about';
import ProfileAdminScreen from '@/app/(tabs)/profile/admin';
import ProfileContractsScreen from '@/app/(tabs)/profile/contracts';
import ProfileDocumentsScreen from '@/app/(tabs)/profile/documents';
import ProfileFavoritesScreen from '@/app/(tabs)/profile/favorites';
import ProfileMyLandsScreen from '@/app/(tabs)/profile/my-lands';

import LandDetailScreen from '@/app/land/[id]';
import AdDetailScreen from '@/app/ad/[id]';
import AddLandScreen from '@/app/add-land';
import MessagesScreen from '@/app/messages/[id]';
import RequestScreen from '@/app/request/[type]';
import ReportScreen from '@/app/report';
import LegalRequestScreen from '@/app/legal/request';
import ContactScreen from '@/app/contact';
import PrivacyScreen from '@/app/privacy';
import TermsScreen from '@/app/terms';
import AIChatScreen from '@/app/ai-chat';
import NotFoundScreen from '@/app/+not-found';

// Force RTL
document.documentElement.dir = 'rtl';
document.documentElement.lang = 'ar';

// Tab bar component
function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  const tabs = [
    { name: 'home', label: t('nav.home'), icon: Home, path: '/home' },
    { name: 'explore', label: t('nav.explore'), icon: Compass, path: '/explore' },
    { name: 'map', label: t('nav.map'), icon: MapPin, path: '/map' },
    { name: 'requests', label: t('nav.requests'), icon: FileText, path: '/requests' },
    { name: 'profile', label: t('nav.profile'), icon: User, path: '/profile' },
  ];

  const currentPath = location.pathname;
  const activeTab = tabs.find((tab) => currentPath.startsWith(tab.path));

  return (
    <View style={tabBarStyles.container}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab?.name === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={tabBarStyles.tab}
            onPress={() => navigate(tab.path)}
          >
            <Icon size={24} color={isActive ? Colors.primary.main : Colors.neutral.light} />
            <Text style={[tabBarStyles.label, { color: isActive ? Colors.primary.main : Colors.neutral.light }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.neutral.white,
    borderTopColor: Colors.neutral.borderLight,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  } as any,
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as any,
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    fontFamily: 'System',
    marginTop: 2,
  } as any,
});

// Auth guard
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading, guestMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !guestMode && !session) {
      navigate('/auth/login', { replace: true });
    }
  }, [session, loading, guestMode, navigate]);

  if (loading) return React.createElement(LoadingState);
  if (!guestMode && !session) return null;
  return React.createElement(React.Fragment, null, children);
}

// Detail pages load by id, so a reload on them must stay on the same page.
const DETAIL_PATH_PATTERN = /^\/(land|partnerships|ad|equipment|services)\/[^/]+$/;

function InitialSplashGate() {
  const location = useLocation();
  const navigate = useNavigate();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;
    if (location.pathname === '/auth/splash') {
      redirectedRef.current = true;
      return;
    }
    if (DETAIL_PATH_PATTERN.test(location.pathname)) {
      redirectedRef.current = true;
      return;
    }
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === 'navigate' || navigation?.type === 'reload') {
      redirectedRef.current = true;
      navigate('/auth/splash', { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}

// Tab layout wrapper
function TabLayout() {
  return React.createElement(React.Fragment, null,
    React.createElement(View, { style: { flex: 1, overflow: 'auto', paddingBottom: 84 } as any },
      React.createElement(Outlet)
    ),
    React.createElement(TabBar)
  );
}

// Profile layout wrapper (just renders child routes)
function ProfileLayout() {
  return React.createElement(Outlet);
}

// Main App
function App() {
  useEffect(() => {
    document.documentElement.dir = 'rtl';
  }, []);

  return React.createElement(HashRouter, null,
    React.createElement(ExpoRouterProvider, null,
      React.createElement(AuthProvider, null,
        React.createElement(I18nProvider, null,
          React.createElement(ToastProvider, null,
            React.createElement(View, { style: { flex: 1, height: '100%', maxWidth: '100%', margin: '0 auto', backgroundColor: Colors.neutral.bg } as any },
              React.createElement(React.Fragment, null,
                React.createElement(InitialSplashGate),
                React.createElement(Routes, null,
                  React.createElement(Route, { path: '/', element: React.createElement(Navigate, { to: '/home', replace: true }) }),

                // Auth routes
                React.createElement(Route, { path: 'auth', element: React.createElement(Outlet) },
                  React.createElement(Route, { path: 'splash', element: React.createElement(SplashScreen) }),
                  React.createElement(Route, { path: 'login', element: React.createElement(LoginScreen) }),
                  React.createElement(Route, { path: 'register', element: React.createElement(RegisterScreen) }),
                  React.createElement(Route, { path: 'forgot-password', element: React.createElement(ForgotPasswordScreen) }),
                  React.createElement(Route, { path: 'reset-password', element: React.createElement(ResetPasswordScreen) }),
                  React.createElement(Route, { path: 'onboarding', element: React.createElement(OnboardingScreen) }),
                  React.createElement(Route, { path: 'welcome', element: React.createElement(WelcomeScreen) }),
                ),

                // Tab routes (protected)
                React.createElement(Route, { element: React.createElement(AuthGuard, null, React.createElement(TabLayout)) },
                  React.createElement(Route, { path: 'home', element: React.createElement(HomeScreen) }),
                  React.createElement(Route, { path: 'explore', element: React.createElement(ExploreScreen) }),
                  React.createElement(Route, { path: 'map', element: React.createElement(MapScreen) }),
                  React.createElement(Route, { path: 'requests', element: React.createElement(RequestsScreen) }),
                  React.createElement(Route, { path: 'notifications', element: React.createElement(NotificationsScreen) }),
                  React.createElement(Route, { path: 'jobs', element: React.createElement(JobsScreen) }),
                  React.createElement(Route, { path: 'insurance', element: React.createElement(InsuranceScreen) }),
                  React.createElement(Route, { path: 'ads', element: React.createElement(AdsScreen) }),
                  React.createElement(Route, { path: 'profile', element: React.createElement(ProfileLayout) },
                    React.createElement(Route, { index: true, element: React.createElement(ProfileScreen) }),
                    React.createElement(Route, { path: 'edit', element: React.createElement(ProfileEditScreen) }),
                    React.createElement(Route, { path: 'settings', element: React.createElement(ProfileSettingsScreen) }),
                    React.createElement(Route, { path: 'about', element: React.createElement(ProfileAboutScreen) }),
                    React.createElement(Route, { path: 'admin', element: React.createElement(ProfileAdminScreen) }),
                    React.createElement(Route, { path: 'contracts', element: React.createElement(ProfileContractsScreen) }),
                    React.createElement(Route, { path: 'documents', element: React.createElement(ProfileDocumentsScreen) }),
                    React.createElement(Route, { path: 'favorites', element: React.createElement(ProfileFavoritesScreen) }),
                    React.createElement(Route, { path: 'my-lands', element: React.createElement(ProfileMyLandsScreen) }),
                  ),
                ),

                // Standalone routes
                React.createElement(Route, { path: 'land/:id', element: React.createElement(LandDetailScreen) }),
                React.createElement(Route, { path: 'partnerships/:id', element: React.createElement(LandDetailScreen) }),
                React.createElement(Route, { path: 'ad/:id', element: React.createElement(AdDetailScreen) }),
                React.createElement(Route, { path: 'equipment/:id', element: React.createElement(AdDetailScreen) }),
                React.createElement(Route, { path: 'services/:id', element: React.createElement(AdDetailScreen) }),
                React.createElement(Route, { path: 'add-land', element: React.createElement(AddLandScreen) }),
                React.createElement(Route, { path: 'messages/:id', element: React.createElement(MessagesScreen) }),
                React.createElement(Route, { path: 'request/:type', element: React.createElement(RequestScreen) }),
                React.createElement(Route, { path: 'report', element: React.createElement(ReportScreen) }),
                React.createElement(Route, { path: 'legal/request', element: React.createElement(LegalRequestScreen) }),
                React.createElement(Route, { path: 'contact', element: React.createElement(ContactScreen) }),
                React.createElement(Route, { path: 'privacy', element: React.createElement(PrivacyScreen) }),
                React.createElement(Route, { path: 'terms', element: React.createElement(TermsScreen) }),
                React.createElement(Route, { path: 'ai-chat', element: React.createElement(AIChatScreen) }),

                // 404
                  React.createElement(Route, { path: '*', element: React.createElement(NotFoundScreen) }),
                ),
                React.createElement(AIFloatingButton)
              )
            )
          )
        )
      )
    )
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(React.createElement(ErrorBoundary, null, React.createElement(App)));
