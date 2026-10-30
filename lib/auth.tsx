import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile, UserRole } from '@/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: UserRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  clearLocalState: () => void;
  refreshProfile: () => Promise<void>;
  guestMode: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  roles: [],
  loading: true,
  signOut: async () => {},
  clearLocalState: () => {},
  refreshProfile: async () => {},
  guestMode: false,
  enterGuestMode: () => {},
  exitGuestMode: () => {},
});

const GUEST_MODE_KEY = '@velora_guest_mode';

const AUTH_STORAGE_KEYS = [
  'sb-yjzmubpwxjxnaprmfywq-auth-token',
  'supabase.auth.token',
];

function clearSupabaseStorage() {
  try {
    for (const key of AUTH_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-') && key.includes('auth-token')) {
        localStorage.removeItem(key);
      }
    });
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(() => {
    try {
      return localStorage.getItem(GUEST_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const mountedRef = useRef(true);

  const clearState = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setRoles([]);
  }, []);

  const enterGuestMode = useCallback(() => {
    try {
      localStorage.setItem(GUEST_MODE_KEY, 'true');
    } catch {}
    setGuestMode(true);
  }, []);

  const exitGuestMode = useCallback(() => {
    try {
      localStorage.removeItem(GUEST_MODE_KEY);
    } catch {}
    setGuestMode(false);
  }, []);

  const loadProfile = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) return false;

      if (!profileData) {
        if (mountedRef.current) {
          setProfile(null);
          setRoles([]);
        }
        return true;
      }

      const { data: rolesData } = await supabase
        .from('users_roles')
        .select('role')
        .eq('user_id', userId);

      if (!mountedRef.current) return true;

      setProfile(profileData as Profile);
      setRoles((rolesData || []).map((r) => r.role as UserRole));
      return true;
    } catch {
      if (mountedRef.current) {
        setProfile(null);
        setRoles([]);
      }
      return false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    let cancelled = false;

    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();

      if (cancelled) return;

      if (s?.user) {
        exitGuestMode();
        const valid = await loadProfile(s.user.id);
        if (cancelled) return;

        if (!valid) {
          await supabase.auth.signOut({ scope: 'global' });
          clearSupabaseStorage();
          clearState();
          setLoading(false);
          return;
        }

        setSession(s);
        setUser(s.user);
        setLoading(false);
      } else {
        clearState();
        setLoading(false);
      }
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, s) => {
      if (cancelled) return;

      if (event === 'SIGNED_OUT' || !s?.user) {
        clearState();
        setLoading(false);
        return;
      }

      setSession(s);
      setUser(s.user);

      (async () => {
        const valid = await loadProfile(s.user.id);
        if (cancelled) return;

        if (!valid) {
          await supabase.auth.signOut({ scope: 'global' });
          clearSupabaseStorage();
          clearState();
        }
        setLoading(false);
      })();
    });

    return () => {
      cancelled = true;
      mountedRef.current = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadProfile, clearState, exitGuestMode]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch {}
    clearSupabaseStorage();
    clearState();
    exitGuestMode();
  }, [clearState, exitGuestMode]);

  const clearLocalState = useCallback(() => {
    clearSupabaseStorage();
    clearState();
    exitGuestMode();
  }, [clearState, exitGuestMode]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  return (
    <AuthContext.Provider
      value={{ session, user, profile, roles, loading, signOut, clearLocalState, refreshProfile, guestMode, enterGuestMode, exitGuestMode }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
