import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Heading } from '../components/Heading';
import { Panel } from '../components/Panel';
import { Screen } from '../components/Screen';
import { colors } from '../constants/theme';
import { Heart, Clock3, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function PendingAccess() {
  const { user, ageStatus, refreshAgeStatus } = useAuth();
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);

  const signOut = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    setBusy(false);
    if (error) {
      Alert.alert('Could not sign out', 'Please try again.');
      return;
    }
    router.replace('/(auth)/welcome');
  };

  const checkStatus = async () => {
    setChecking(true);
    await refreshAgeStatus();
    setChecking(false);
  };

  const statusLabel = ageStatus === 'verified'
    ? 'Verified'
    : ageStatus === 'rejected'
      ? 'Not verified'
      : ageStatus === 'unavailable'
        ? 'Unable to check'
        : 'Pending';

  return (
    <Screen>
      <View style={styles.mark}><Heart size={38} color={colors.pink} strokeWidth={2} /></View>
      <Heading eyebrow="ACCOUNT CREATED" title="You're on your way" subtitle={user?.email ?? 'Your account is signed in.'} />
      <Panel>
        <Text style={styles.heading}>Age assurance is required before CRUSH opens.</Text>
        <Text style={styles.body}>CRUSH is intended for adults aged 18 and above. Age must be confirmed by a trusted service, not by a checkbox or information stored only on your phone.</Text>
      </Panel>
      <Panel>
        <View style={styles.statusRow}><Clock3 size={17} color={colors.pink} /><Text style={styles.status}>Age assurance · {statusLabel}</Text></View>
        <Text style={styles.body}>Your profile stays hidden until the trusted verification service records an approved result. CRUSH checks that status directly with its server.</Text>
      </Panel>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: checking }} disabled={checking} style={styles.refreshButton} onPress={checkStatus}>
        <RefreshCw size={17} color="white" />
        <Text style={styles.buttonText}>{checking ? 'Checking…' : 'Refresh age-verification status'}</Text>
      </Pressable>
      <Text style={styles.note}>UNESWA student verification is not required. Discovery, matching, community interactions and messaging remain locked until trusted 18+ age assurance is complete.</Text>
      <Pressable accessibilityRole="button" disabled={busy} style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>{busy ? 'Signing out…' : 'Sign out'}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mark: { width: 70, height: 70, borderRadius: 24, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14 },
  heading: { color: colors.black, fontSize: 16, fontWeight: '900' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { color: colors.pink, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  button: { backgroundColor: colors.pink, borderRadius: 14, padding: 16, alignItems: 'center' },
  refreshButton: { backgroundColor: colors.black, borderRadius: 14, padding: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  buttonText: { color: 'white', fontWeight: '900' },
});
