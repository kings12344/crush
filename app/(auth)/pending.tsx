import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

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
      <View style={styles.mark}><Text style={styles.heart}>♥</Text></View>
      <Heading eyebrow="ACCOUNT CREATED" title="You're on your way" subtitle={user?.email ?? 'Your account is signed in.'} />
      <Panel>
        <Text style={styles.heading}>Your account is not eligible for discovery yet.</Text>
        <Text style={styles.body}>CRUSH is restricted to adults aged 18+ and verified University of Eswatini students. These checks must be completed by trusted services, not by a checkbox or information stored on your phone.</Text>
      </Panel>
      <Panel>
        <Text style={styles.status}>Age assurance · Pending</Text>
        <Text style={styles.body}>No age-verification provider is connected yet.</Text>
        <View style={styles.divider} />
        <Text style={styles.status}>UNESWA student status · Pending</Text>
        <Text style={styles.body}>The University-approved student verification process is still being arranged.</Text>
      </Panel>
      <Text style={styles.note}>Your profile has been created as hidden. Discovery, matching and messaging remain unavailable until the required checks and server-side access controls are implemented.</Text>
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
  status: { color: colors.pink, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  button: { backgroundColor: colors.pink, borderRadius: 14, padding: 16, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '900' },
});
