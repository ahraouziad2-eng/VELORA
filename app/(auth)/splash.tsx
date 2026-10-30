import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { BrandLogo } from '@/components/BrandLogo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@agriland_onboarding_complete';

export default function SplashScreen() {
  const { session, user, profile, loading, guestMode } = useAuth();
  const navigatedRef = useRef(false);
  const [exiting, setExiting] = useState(false);

  const navigate = (hasSession: boolean, isGuest: boolean) => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;

    const doNavigate = () => {
      if (hasSession && user?.email_confirmed_at) {
        router.replace('/(tabs)');
        return;
      }
      if (hasSession && user && !user.email_confirmed_at) {
        supabase.auth.signOut({ scope: 'global' }).finally(() => {
          router.replace('/(auth)/login');
        });
        return;
      }
      if (isGuest) {
        router.replace('/(tabs)');
        return;
      }

      AsyncStorage.getItem(ONBOARDING_KEY)
        .then((done: string | null) => {
          if (done === 'true') {
            router.replace('/(auth)/welcome');
          } else {
            router.replace('/(auth)/onboarding');
          }
        })
        .catch(() => router.replace('/(auth)/onboarding'));
    };

    setExiting(true);
    setTimeout(doNavigate, 500);
  };

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => navigate(!!session && !!user, guestMode), 2800);
    return () => clearTimeout(timer);
  }, [session, loading, user, profile, guestMode]);

  useEffect(() => {
    const fallback = setTimeout(() => navigate(!!session && !!user, guestMode), 4500);
    return () => clearTimeout(fallback);
  }, [session, profile, guestMode]);

  return (
    <div className={`sa-splash-root${exiting ? ' sa-splash-exit' : ''}`}>
      <div className="sa-splash-background" />

      <div className="sa-splash-glow" />

      <span className="sa-ring sa-ring-1" />
      <span className="sa-ring sa-ring-2" />
      <span className="sa-ring sa-ring-3" />

      <div className="sa-splash-logo-reveal">
        <div className="sa-splash-logo-float">
          <div className="sa-splash-logo-container">
            <BrandLogo variant="icon" size={120} />
          </div>
        </div>
      </div>

      <div className="sa-splash-brand">VELORA</div>
      <div className="sa-splash-brand-en">One Platform. Endless Possibilities.</div>
      <div className="sa-splash-tagline">منصة واحدة. إمكانات لا حدود لها.</div>

      <span className="sa-particle sa-particle-1" />
      <span className="sa-particle sa-particle-2" />
      <span className="sa-particle sa-particle-3" />
      <span className="sa-particle sa-particle-4" />
      <span className="sa-particle sa-particle-5" />
      <span className="sa-particle sa-particle-6" />
      <span className="sa-particle sa-particle-7" />
      <span className="sa-particle sa-particle-8" />

      <div className="sa-splash-loader">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
