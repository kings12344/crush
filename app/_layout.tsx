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
        if (!session && root === '(tabs)') {
      router.replace('/(auth)/welcome');
      return;
    }

    if (session && root === '(auth)') {
      router.replace('/pending');
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
