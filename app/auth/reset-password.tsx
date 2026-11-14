import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function ResetPassword() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Validating your password reset link…');

  useEffect(() => {
    let active = true;
    async function exchange() {
      if (!code || typeof code !== 'string') {
        const { data } = await supabase.auth.getSession();
        if (active && data.session) {
          setReady(true);
          setMessage('Choose a new password for your CRUSH account.');
        } else if (active) {
          setMessage('This reset link is missing or expired. Return to sign in and request a new one.');
        }
        return;
      }
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (active && !error && data.session) {
        setReady(true);
        setMessage('Choose a new password for your CRUSH account.');
      } else if (active) {
        setMessage('This reset link may have expired or already been used. Request a new one from the sign-in screen.');
      }
    }
    exchange();
    return () => { active = false; };
  }, [code]);

  const save = async () => {
    if (password.length < 12) {
      Alert.alert('Password too short', 'Use at least 12 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match', 'Enter the same new password in both fields.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      Alert.alert('Could not update password', 'The reset link may have expired. Request a new one and try again.');
      return;
    }
    router.replace('/(auth)/pending');
  };

  return (
    <Screen>
      <Heading eyebrow="ACCOUNT RECOVERY" title="Choose a new password" subtitle="Use a unique password that you do not use on another service." />
      <Panel>
        <Text style={styles.message}>{message}</Text>
        {ready && <>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" placeholder="New password (12+ characters)" style={styles.input} />
          <TextInput value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" placeholder="Confirm new password" style={styles.input} />
          <Pressable disabled={busy} style={styles.button} onPress={save}>
            <Text style={styles.buttonText}>{busy ? 'Updating…' : 'Update password'}</Text>
          </Pressable>
        </>}
      </Panel>
      <Pressable onPress={() => router.replace('/(auth)/login')}><Text style={styles.link}>Back to sign in</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  message: { color: colors.muted, lineHeight: 20 },
  input: { backgroundColor: '#FFF8FB', borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14, color: colors.black, marginTop: 12 },
  button: { backgroundColor: colors.pink, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 14 },
  buttonText: { color: 'white', fontWeight: '900' },
  link: { textAlign: 'center', color: colors.pink, fontWeight: '800', padding: 14 },
});
