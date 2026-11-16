import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/theme';
import { ensureProfile } from '../../lib/auth-profile';
import { assertSupabaseConfigured, supabase } from '../../lib/supabase';
import { startGoogleSignIn } from '../../lib/google-auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const signIn = async () => {
    setNotice('');
    if (!email.trim() || !password) {
      setNotice('Enter your email address and password.');
      return;
    }
    setBusy(true);
    try {
      assertSupabaseConfigured();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error || !data.user) {
        setNotice('Unable to sign in. Check your details and confirm your email address, then try again.');
        return;
      }
      await ensureProfile(data.user);
      router.replace('/pending');
    } catch {
      setNotice('CRUSH could not complete sign-in. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    setNotice('');
    setBusy(true);
    try {
      await startGoogleSignIn();
      setBusy(false);
    } catch {
      setNotice('Google sign-in is unavailable right now. Please try again later.');
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setNotice('');
    if (!email.trim()) {
      setNotice('Enter your email address first. We will send a recovery link if an account can receive one.');
      return;
    }
    setBusy(true);
    try {
      assertSupabaseConfigured();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: 'crush://auth/reset-password',
      });
      setNotice(error
        ? 'We could not send a recovery email. Check the address and try again.'
        : 'If this address has a CRUSH account, a password recovery link will be sent.');
    } catch {
      setNotice('Password recovery is temporarily unavailable. Try again later.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.replace('/(auth)/welcome')}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Heading eyebrow="WELCOME BACK" title="Sign in" subtitle="Sign in to your CRUSH account." />
      <Panel>
        <Text style={styles.label}>Email address</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="you@example.com"
          placeholderTextColor="#9A9097"
          style={styles.input}
          editable={!busy}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          placeholder="Your password"
          placeholderTextColor="#9A9097"
          style={styles.input}
          editable={!busy}
          onSubmitEditing={signIn}
          returnKeyType="go"
        />
        {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
        <Pressable accessibilityRole="button" disabled={busy} style={styles.primary} onPress={signIn}>
          {busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Sign in</Text>}
        </Pressable>
        <Pressable accessibilityRole="button" disabled={busy} style={styles.google} onPress={signInWithGoogle}>
          <Text style={styles.googleText}>Continue with Google</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={resetPassword} style={styles.forgot}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>
      </Panel>
      <View style={styles.footer}>
        <Text style={styles.footerText}>New to CRUSH?</Text>
        <Pressable onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.link}>Create an account</Text>
        </Pressable>
      </View>
      <Text style={styles.disclaimer}>Signing in does not bypass CRUSH's trusted 18+ age assurance checks.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { fontSize: 17, color: colors.pink, fontWeight: '800', marginBottom: 8 },
  label: { color: colors.black, fontSize: 13, fontWeight: '800', marginTop: 8 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFF8FB', color: colors.black, padding: 14, borderRadius: 12, marginTop: 7, marginBottom: 8 },
  primary: { backgroundColor: colors.pink, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 12, minHeight: 52, justifyContent: 'center' },
  primaryText: { color: 'white', fontWeight: '900', fontSize: 16 },
  forgot: { padding: 12, alignItems: 'center' },
  google: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 10, minHeight: 52, justifyContent: 'center' },
  googleText: { color: colors.black, fontWeight: '900', fontSize: 15 },
  link: { color: colors.pink, fontWeight: '900' },
  notice: { color: colors.pinkDark, backgroundColor: colors.blush, padding: 11, borderRadius: 10, lineHeight: 18, marginTop: 8 },
  footer: { flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center', padding: 12 },
  footerText: { color: colors.muted },
  disclaimer: { textAlign: 'center', color: colors.muted, fontSize: 11, lineHeight: 17 },
});
