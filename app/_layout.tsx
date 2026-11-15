import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const root = segments[0];
    const isPendingScreen = root === 'pending';
    const isAuthCallback = root === 'auth';

    if (!session && (root === '(tabs)' || isPendingScreen)) {
      router.replace('/(auth)/welcome');
      return;
    }

    // Until trusted age + student verification and a server-side eligibility
    // gate exist, signed-in users must not reach prototype tabs via deep links.
    // Keep email confirmation and password-reset callbacks reachable.
    if (session && !isPendingScreen && !isAuthCallback) {
      router.replace('/pending');
    }
  }, [loading, session?.user.id, segments]);

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
