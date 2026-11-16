import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function RootNavigator() {
  const { session, loading, ageStatus, studentStatus } = useAuth();
  const segments = useSegments() as string[];

  useEffect(() => {
    if (loading) return;
    const root = segments[0];
    const isPendingScreen = root === 'pending';
    const isAuthCallback = root === 'auth';
    const isAuthArea = root === '(auth)' || isAuthCallback;
    const eligible = ageStatus === 'verified' && studentStatus === 'verified';

    // Every tab stays locked until trusted 18+ and current UNESWA student
    // verification are both confirmed by authenticated server RPCs.
    if (!session && (root === '(tabs)' || isPendingScreen)) {
      router.replace('/(auth)/welcome');
      return;
    }
    // Pending, rejected, unknown and unavailable statuses fail closed.
    if (session && !eligible && !isPendingScreen && !isAuthCallback) {
      router.replace('/pending');
      return;
    }
    if (session && eligible && (isPendingScreen || isAuthArea)) {
      router.replace('/(tabs)/discover');
    }
  }, [loading, session?.user.id, ageStatus, studentStatus, segments]);

  return <><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false }} /></>;
}

export default function RootLayout() {
  return <AuthProvider><RootNavigator /></AuthProvider>;
}
