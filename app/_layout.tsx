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
    const second = segments[1];

    if (!session && root === '(tabs)') {
      router.replace('/(auth)/welcome');
      return;
    }

    if (session && root === '(auth)' && second !== 'pending') {
      router.replace('/(auth)/pending');
    }
  }, [loading, session?.user.id, segments]);

  return <>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerShown: false }} />
  </>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
