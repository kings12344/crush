import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function RootNavigator() {
  const { session, loading, ageStatus } = useAuth();
  const segments = useSegments() as string[];

  useEffect(() => {
    if (loading) return;

    const root = segments[0];
    const isPendingScreen = root === 'pending';
    const isAuthCallback = root === 'auth';
    const isAuthArea = root === '(auth)' || isAuthCallback;

    // CRUSH is an adults-only app. No tab, including Reels, is available
    // until a trusted server-side age-verification result is confirmed.
    if (!session && (root === '(tabs)' || isPendingScreen)) {
      router.replace('/(auth)/welcome');
      return;
    }

    // Verification status is read from the private Supabase record through
    // an authenticated RPC. Failures and unknown states remain locked.
    if (session && ageStatus !== 'verified' && !isPendingScreen && !isAuthCallback) {
      router.replace('/pending');
      return;
    }

    if (session && ageStatus === 'verified' && (isPendingScreen || isAuthArea)) {
      router.replace('/(tabs)/discover');
    }
  }, [loading, session?.user.id, ageStatus, segments]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
