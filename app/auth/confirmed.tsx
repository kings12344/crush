import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/theme';
import { ensureProfile } from '../../lib/auth-profile';
import { supabase } from '../../lib/supabase';

export default function EmailConfirmed() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [status, setStatus] = useState('Checking your confirmation link…');

  useEffect(() => {
    let active = true;
    async function confirm() {
      if (!code || typeof code !== 'string') {
        setStatus('If you have just confirmed your email, return to CRUSH and sign in. If the link expired, request a new one.');
        return;
      }
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error || !data.user) {
          if (active) setStatus('This confirmation link may have expired or already been used. Return to sign in and request a fresh link if needed.');
          return;
        }
        await ensureProfile(data.user);
        if (active) router.replace('/pending');
      } catch {
        if (active) setStatus('We could not complete email confirmation right now. Check your connection and try again, or return to sign in.');
      }
    }
    confirm();
    return () => { active = false; };
  }, [code]);

  return (
    <Screen>
      <Heading eyebrow="EMAIL CONFIRMATION" title="Confirm your email" subtitle="Secure account setup for CRUSH." />
      <Panel><Text style={styles.body}>{status}</Text></Panel>
      <Pressable style={styles.button} onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.buttonText}>Continue to sign in</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.muted, lineHeight: 21 },
  button: { backgroundColor: colors.pink, borderRadius: 14, padding: 16, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '900' },
});
