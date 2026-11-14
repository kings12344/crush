import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../components/Screen';
import { Heading } from '../components/Heading';
import { Panel } from '../components/Panel';
import { colors } from '../constants/theme';
import { assertSupabaseConfigured, supabase } from '../lib/supabase';

type BlockedUser = { blocked_user_id: string; display_name: string; blocked_at: string };
const guidance = [
  ['Keep control of personal information', 'Avoid sharing your home address, financial details, passwords, verification documents, or real-time location in a profile or chat. CRUSH does not need your password outside sign-in.'],
  ['Meet safely', 'For a first meeting, choose a public place, arrange your own transport, tell someone you trust where you are going, and leave if you feel uncomfortable.'],
  ['Respect consent and boundaries', 'A match is not consent to messages, photos, calls, or an in-person meeting. Stop contact when asked. Never pressure anyone to send intimate content.'],
  ['Block and report', 'Blocking hides each account from the other in discovery and prevents messages under the server access rules. Reports are submitted privately for review.'],
];

export default function Safety() {
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadBlocked = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      assertSupabaseConfigured();
      const { data, error: requestError } = await supabase.rpc('get_blocked_users');
      if (requestError) throw requestError;
      setBlocked((data ?? []) as BlockedUser[]);
    } catch {
      setBlocked([]);
      setError('Your blocked list could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadBlocked(); }, [loadBlocked]));

  const unblock = (person: BlockedUser) => {
    Alert.alert('Unblock this account?', person.display_name + ' may be able to find and contact you again if both accounts meet CRUSH eligibility rules.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unblock', style: 'destructive', onPress: async () => {
        setBusyId(person.blocked_user_id);
        try {
          const { error: requestError } = await supabase.rpc('unblock_user', { p_blocked_user_id: person.blocked_user_id });
          if (requestError) throw requestError;
          setBlocked((current) => current.filter((item) => item.blocked_user_id !== person.blocked_user_id));
        } catch {
          Alert.alert('Could not unblock', 'Please check your connection and try again.');
        } finally {
          setBusyId(null);
        }
      }},
    ]);
  };

  return <Screen>
    <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={s.back}>‹ Back to profile</Text></Pressable>
    <Heading eyebrow="YOUR SAFETY MATTERS" title="Safety center" subtitle="Practical guidance and controls for your CRUSH account." />
    {guidance.map(([title, body]) => <Panel key={title}><Text style={s.title}>{title}</Text><Text style={s.body}>{body}</Text></Panel>)}
    <Panel>
      <Text style={s.title}>Blocked accounts</Text>
      <Text style={s.body}>Only you can see this list. Blocking prevents discovery in both directions and blocks messages between the two accounts.</Text>
      {loading ? <ActivityIndicator color={colors.pink} /> : error ? <Text style={s.body}>{error}</Text> : blocked.length ? blocked.map((person) => (
        <Panel key={person.blocked_user_id} style={s.blockedRow}>
          <Text style={s.blockedName}>{person.display_name}</Text>
          <Text style={s.small}>Blocked {new Date(person.blocked_at).toLocaleDateString()}</Text>
          <Pressable accessibilityRole="button" disabled={busyId !== null} style={s.unblock} onPress={() => unblock(person)}>
            <Text style={s.unblockText}>{busyId === person.blocked_user_id ? 'Unblocking…' : 'Unblock'}</Text>
          </Pressable>
        </Panel>
      )) : <Text style={s.body}>You have not blocked any accounts.</Text>}
      <Pressable accessibilityRole="button" disabled={loading} onPress={() => void loadBlocked()}><Text style={s.refresh}>Refresh blocked list</Text></Pressable>
    </Panel>
    <Panel><Text style={s.title}>Need immediate help?</Text><Text style={s.body}>If you are in immediate danger, contact local emergency services or a trusted person nearby. CRUSH is not an emergency response service.</Text></Panel>
    <Panel><Text style={s.title}>Current limitations</Text><Text style={s.body}>Age assurance and UNESWA student verification are not yet connected. Accounts remain pending and hidden. A moderator review team and emergency response service are not available yet.</Text></Panel>
  </Screen>;
}
const s = StyleSheet.create({
  back: { color: colors.pink, fontSize: 16, fontWeight: '800' },
  title: { color: colors.black, fontWeight: '900', fontSize: 16 },
  body: { color: colors.muted, lineHeight: 21 },
  blockedRow: { padding: 12, gap: 6 },
  blockedName: { color: colors.black, fontWeight: '800' },
  small: { color: colors.muted, fontSize: 12 },
  unblock: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.pink, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  unblockText: { color: colors.pink, fontWeight: '800' },
  refresh: { color: colors.pink, fontWeight: '800', paddingTop: 6 },
});
