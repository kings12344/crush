import { AppState } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type EligibilityStatus = 'loading' | 'pending' | 'verified' | 'rejected' | 'needs_review' | 'unavailable';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  ageStatus: EligibilityStatus;
  studentStatus: EligibilityStatus;
  refreshEligibilityStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  ageStatus: 'loading',
  studentStatus: 'loading',
  refreshEligibilityStatus: async () => {},
});

function normalizeStatus(value: unknown): EligibilityStatus {
  if (value === 'verified' || value === 'rejected' || value === 'needs_review') return value;
  return 'pending';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [ageStatus, setAgeStatus] = useState<EligibilityStatus>('loading');
  const [studentStatus, setStudentStatus] = useState<EligibilityStatus>('loading');
  const checkGeneration = useRef(0);
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

  const refreshEligibilityStatus = useCallback(async () => {
    if (!userId || !isSupabaseConfigured) {
      setAgeStatus('loading');
      setStudentStatus('loading');
      return;
    }
    const generation = ++checkGeneration.current;
    try {
      const [ageResult, studentResult] = await Promise.all([
        supabase.rpc('get_my_age_verification_status'),
        supabase.rpc('get_my_student_verification_status'),
      ]);
      if (generation !== checkGeneration.current) return;
      if (ageResult.error) throw ageResult.error;
      if (studentResult.error) throw studentResult.error;
      setAgeStatus(normalizeStatus(ageResult.data));
      setStudentStatus(normalizeStatus(studentResult.data));
    } catch {
      // Either failed check keeps the entire app locked.
      if (generation === checkGeneration.current) {
        setAgeStatus('unavailable');
        setStudentStatus('unavailable');
      }
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      checkGeneration.current += 1;
      setAgeStatus('loading');
      setStudentStatus('loading');
      return;
    }
    checkGeneration.current += 1;
    setAgeStatus('loading');
    setStudentStatus('loading');
    void refreshEligibilityStatus();
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshEligibilityStatus();
    });
    return () => appStateSubscription.remove();
  }, [userId, refreshEligibilityStatus]);

  const value = useMemo(() => ({
    session, user: session?.user ?? null, loading, ageStatus, studentStatus, refreshEligibilityStatus,
  }), [session, loading, ageStatus, studentStatus, refreshEligibilityStatus]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
