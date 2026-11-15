import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/theme';
import { ensureProfile } from '../../lib/auth-profile';
import { assertSupabaseConfigured, supabase } from '../../lib/supabase';
import { startGoogleSignIn } from '../../lib/google-auth';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const register = async () => {
    setNotice('');
    const name = displayName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (name.length < 2 || name.length > 40) {
      setNotice('Your display name must be between 2 and 40 characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setNotice('Enter a valid email address.');
      return;
    }
    if (password.length < 12) {
      setNotice('Use a password with at least 12 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setNotice('Your passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      assertSupabaseConfigured();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { display_name: name },
          emailRedirectTo: 'crush://auth/confirmed',
        },
      });

      if (error) {
        setNotice('We could not create the account with those details. If you already have an account, sign in or use password recovery.');
        return;
      }

      if (data.session && data.user) {
        await ensureProfile(data.user);
        router.replace('/pending');
        return;
      }

      setNotice('Your request was received. Check your email for the confirmation link, then return to CRUSH and sign in. If no email arrives, check spam or try again later.');
    } catch {
      setNotice('CRUSH could not finish account setup. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const registerWithGoogle = async () => {
    setNotice('');
    setBusy(true);
    try {
      await startGoogleSignIn();
      setBusy(false);
    } catch {
      setNotice('Google sign-up is unavailable right now. Please try again later.');
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.replace('/(auth)/welcome')}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Heading eyebrow="JOIN CRUSH" title="Create account" subtitle="Start with your account details. Verification is a separate step." />
      <Panel>
        <Text style={styles.label}>Display name</Text>
        <TextInput value={displayName} onChangeText={setDisplayName} autoCapitalize="words" maxLength={40} placeholder="What should people call you?" placeholderTextColor="#9A9097" style={styles.input} editable={!busy} />
        <Text style={styles.label}>Email address</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" placeholder="you@example.com" placeholderTextColor="#9A9097" style={styles.input} editable={!busy} />
        <Text style={styles.label}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" placeholder="At least 12 characters" placeholderTextColor="#9A9097" style={styles.input} editable={!busy} />
        <Text style={styles.label}>Confirm password</Text>
        <TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" textContentType="newPassword" placeholder="Enter your password again" placeholderTextColor="#9A9097" style={styles.input} editable={!busy} />
        {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
        <Pressable accessibilityRole="button" disabled={busy} style={styles.primary} onPress={register}>
          {busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Create account</Text>}
        </Pressable>
        <Pressable accessibilityRole="button" disabled={busy} style={styles.google} onPress={registerWithGoogle}>
          <Text style={styles.googleText}>Continue with Google</Text>
        </Pressable>
      </Panel>
      <Text style={styles.eligibility}>CRUSH is for adults aged 18+ in Eswatini. Creating an account does not establish age or unlock age-restricted features.</Text>
      <Pressable onPress={() => router.push('/(auth)/login')}><Text style={styles.link}>Already have an account? Sign in</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { fontSize: 17, color: colors.pink, fontWeight: '800', marginBottom: 8 },
  label: { color: colors.black, fontSize: 13, fontWeight: '800', marginTop: 7 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFF8FB', color: colors.black, padding: 14, borderRadius: 12, marginTop: 7, marginBottom: 8 },
  primary: { backgroundColor: colors.pink, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 12, minHeight: 52, justifyContent: 'center' },
  primaryText: { color: 'white', fontWeight: '900', fontSize: 16 },
  google: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 10, minHeight: 52, justifyContent: 'center' },
  googleText: { color: colors.black, fontWeight: '900', fontSize: 15 },
  notice: { color: colors.pinkDark, backgroundColor: colors.blush, padding: 11, borderRadius: 10, lineHeight: 18, marginTop: 8 },
  eligibility: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginVertical: 12 },
  link: { color: colors.pink, fontWeight: '900', textAlign: 'center', padding: 10 },
});
