import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Heading } from '../components/Heading';
import { Panel } from '../components/Panel';
import { Screen } from '../components/Screen';
import { colors } from '../constants/theme';
import { Heart, Clock3 } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function PendingAccess() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

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

  return (
    <Screen>
      <View style={styles.mark}><Heart size={38} color={colors.pink} strokeWidth={2} /></View>
      <Heading eyebrow="ACCOUNT CREATED" title="You're on your way" subtitle={user?.email ?? 'Your account is signed in.'} />
      <Panel>
        <Text style={styles.heading}>Age assurance is required before discovery opens.</Text>
        <Text style={styles.body}>CRUSH is intended for adults aged 18 and above. Age must be confirmed by a trusted service, not by a checkbox or information stored only on your phone.</Text>
      </Panel>
      <Panel>
        <View style={styles.statusRow}><Clock3 size={17} color={colors.pink} /><Text style={styles.status}>Age assurance · Pending</Text></View>
        <Text style={styles.body}>No age-verification provider is connected yet.</Text>
      </Panel>
      <Text style={styles.note}>Your profile remains hidden. Discovery, matching and messaging stay unavailable until trusted age assurance and the corresponding server-side access controls are implemented. UNESWA student verification is not required.</Text>
      <Pressable accessibilityRole="button" disabled={busy} style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>{busy ? 'Signing out…' : 'Sign out'}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mark: { width: 70, height: 70, borderRadius: 24, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14 },
  heart: { color: colors.pink, fontSize: 40 },
  heading: { color: colors.black, fontSize: 16, fontWeight: '900' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { color: colors.pink, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  button: { backgroundColor: colors.pink, borderRadius: 14, padding: 16, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '900' },
});
