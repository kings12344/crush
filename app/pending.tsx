import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Heading } from '../components/Heading';
import { Panel } from '../components/Panel';
import { Screen } from '../components/Screen';
import { colors } from '../constants/theme';
import { Heart, Clock3, RefreshCw } from 'lucide-react-native';
import { useAuth, type EligibilityStatus } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

function statusLabel(status: EligibilityStatus): string {
  if (status === 'verified') return 'Verified';
  if (status === 'rejected') return 'Not verified';
  if (status === 'needs_review') return 'Review required';
  if (status === 'unavailable') return 'Unable to check';
  if (status === 'loading') return 'Checking';
  return 'Pending';
}

export default function PendingAccess() {
  const { user, ageStatus, studentStatus, refreshEligibilityStatus } = useAuth();
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
    await refreshEligibilityStatus();
    setChecking(false);
  };

  return (
    <Screen>
      <View style={styles.mark}><Heart size={38} color={colors.pink} strokeWidth={2} /></View>
      <Heading eyebrow="ACCOUNT CREATED" title="You're on your way" subtitle={user?.email ?? 'Your account is signed in.'} />
      <Panel>
        <Text style={styles.heading}>Two eligibility checks are required before CRUSH opens.</Text>
        <Text style={styles.body}>CRUSH is exclusively for current University of Eswatini students aged 18 and above. Both requirements must be confirmed by trusted services. A checkbox, student email address or information stored only on your phone cannot grant access.</Text>
      </Panel>
      <Panel>
        <View style={styles.statusRow}><Clock3 size={17} color={colors.pink} /><Text style={styles.status}>Age assurance · {statusLabel(ageStatus)}</Text></View>
        <Text style={styles.body}>A trusted age-assurance service must confirm that you are at least 18.</Text>
        <View style={styles.divider} />
        <View style={styles.statusRow}><Clock3 size={17} color={colors.pink} /><Text style={styles.status}>UNESWA student status · {statusLabel(studentStatus)}</Text></View>
        <Text style={styles.body}>A trusted University of Eswatini process must confirm current student eligibility.</Text>
      </Panel>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: checking }} disabled={checking} style={styles.refreshButton} onPress={checkStatus}>
        <RefreshCw size={17} color="white" />
        <Text style={styles.buttonText}>{checking ? 'Checking…' : 'Refresh eligibility status'}</Text>
      </Pressable>
      <Text style={styles.note}>Your profile remains hidden until both checks are verified. The verification providers are not connected yet, so new accounts remain pending. Discovery, matching, community interactions and messaging stay locked.</Text>
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
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  button: { backgroundColor: colors.pink, borderRadius: 14, padding: 16, alignItems: 'center' },
  refreshButton: { backgroundColor: colors.black, borderRadius: 14, padding: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  buttonText: { color: 'white', fontWeight: '900' },
});
