import { AppState } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type AgeVerificationStatus = 'loading' | 'pending' | 'verified' | 'rejected' | 'unavailable';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  ageStatus: AgeVerificationStatus;
  refreshAgeStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  ageStatus: 'loading',
  refreshAgeStatus: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [ageStatus, setAgeStatus] = useState<AgeVerificationStatus>('loading');
  const userId = session?.user.id;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let receivedAuthEvent = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      // Auth events are authoritative. Do not let the initial getSession()
      // promise overwrite a newer sign-in, sign-out, or token-refresh event.
      receivedAuthEvent = true;
      setSession(nextSession);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted || receivedAuthEvent) return;
      if (error) setSession(null);
      else setSession(data.session);
      setLoading(false);
    }).catch(() => {
      if (mounted && !receivedAuthEvent) {
        setSession(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshAgeStatus = useCallback(async () => {
    if (!userId || !isSupabaseConfigured) {
      setAgeStatus('loading');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_my_age_verification_status');
      if (error) throw error;
      if (data === 'verified') setAgeStatus('verified');
      else if (data === 'rejected') setAgeStatus('rejected');
      else setAgeStatus('pending');
    } catch {
      // Fail closed: a network or RPC failure must never unlock the app.
      setAgeStatus('unavailable');
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setAgeStatus('loading');
      return;
    }

    setAgeStatus('loading');
    void refreshAgeStatus();

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshAgeStatus();
    });

    return () => appStateSubscription.remove();
  }, [userId, refreshAgeStatus]);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,
    ageStatus,
    refreshAgeStatus,
  }), [session, loading, ageStatus, refreshAgeStatus]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
