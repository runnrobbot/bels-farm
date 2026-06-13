import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { authService } from '@/features/auth/services/authService';
import { EMPTY_ACCESS, type AccessContext } from '@/features/auth/types';
import type { ProfileRow } from '@/types/database';

interface AuthContextValue {
  session: Session | null;
  profile: ProfileRow | null;
  access: AccessContext;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Owns the single source of truth for the auth session.
 *
 * Subscribes once to Supabase's auth state and derives the profile + effective
 * access. Deliberately avoids redundant fetches: the heavy access/profile load
 * runs only when the user id actually changes, not on every token refresh.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [access, setAccess] = useState<AccessContext>(EMPTY_ACCESS);
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');
  const loadedUserId = useRef<string | null>(null);

  const loadContext = async (userId: string) => {
    const [profileResult, accessResult] = await Promise.all([
      authService.getProfile(userId),
      authService.getAccess(),
    ]);
    setProfile(profileResult);
    setAccess(accessResult);
    loadedUserId.current = userId;
  };

  useEffect(() => {
    let active = true;

    // Hydrate from any persisted session on first mount.
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const current = data.session;
      setSession(current);
      if (current?.user) {
        await loadContext(current.user.id);
        if (active) setStatus('authenticated');
      } else {
        if (active) setStatus('unauthenticated');
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!active) return;
      setSession(newSession);

      if (!newSession?.user) {
        setProfile(null);
        setAccess(EMPTY_ACCESS);
        loadedUserId.current = null;
        setStatus('unauthenticated');
        return;
      }

      // Only reload heavy context when the user identity changes — token
      // refreshes (TOKEN_REFRESHED) keep the same user and need no refetch.
      if (loadedUserId.current !== newSession.user.id) {
        setStatus('loading');
        void loadContext(newSession.user.id).then(() => {
          if (active) setStatus('authenticated');
        });
      } else if (event === 'SIGNED_IN') {
        setStatus('authenticated');
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const refresh = useMemo(
    () => async () => {
      if (session?.user) await loadContext(session.user.id);
    },
    [session?.user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ session, profile, access, status, refresh }),
    [session, profile, access, status, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
