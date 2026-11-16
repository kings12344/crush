import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/theme';
import { ensureProfile } from '../../lib/auth-profile';
import { assertSupabaseConfigured, supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const { code, error: callbackError, error_description: errorDescription } =
    useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const [message, setMessage] = useState('Finishing your secure sign-in…');
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const finish = async () => {
      try {
        if (callbackError) {
          throw new Error(errorDescription || callbackError);
        }
        if (!code || typeof code !== 'string') {
          throw new Error('Google did not return a sign-in code. Please try again.');
        }

        assertSupabaseConfigured();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        if (!data.user) throw new Error('Google sign-in completed without a user account.');

        await ensureProfile(data.user);
        router.replace('/pending');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Google sign-in could not be completed. Please try again.');
      }
    };

    void finish();
  }, [code, callbackError, errorDescription]);

  return (
    <Screen style={styles.container}>
      <ActivityIndicator size="large" color={colors.pink} />
      <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>
      {message !== 'Finishing your secure sign-in…' ? (
        <Text onPress={() => router.replace('/(auth)/login')} style={styles.link}>Return to sign in</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  message: { color: colors.black, textAlign: 'center', lineHeight: 22 },
  link: { color: colors.pink, fontWeight: '800', padding: 12 },
});
