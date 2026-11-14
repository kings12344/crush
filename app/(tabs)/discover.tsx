import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View, Pressable, StyleSheet } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { colors } from '../../constants/theme';
import { assertSupabaseConfigured, supabase } from '../../lib/supabase';

type Mode = 'Dating' | 'Friends';
type Profile = {
  id: string;
  display_name: string;
  bio: string | null;
  campus_name: string | null;
  dating_enabled: boolean;
  friendship_enabled: boolean;
};
type MatchActionResult = { matched: boolean; match_id: string | null };

export default function Discover() {
  const [mode, setMode] = useState<Mode>('Dating');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      assertSupabaseConfigured();
      const { data, error: requestError } = await supabase.rpc('discover_profiles', {
        p_mode: mode === 'Dating' ? 'dating' : 'friendship',
        p_limit: 20,
      });
      if (requestError) throw requestError;
      setProfiles((data ?? []) as Profile[]);
      setDismissed([]);
    } catch {
      setProfiles([]);
      setError('CRUSH could not load verified campus profiles. Check your connection and backend configuration, then try again.');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const visibleProfiles = profiles.filter((profile) => !dismissed.includes(profile.id));

  const act = async (kind: 'Like' | 'Secret Crush', profile: Profile) => {
    if (mode !== 'Dating') {
      Alert.alert('Friends mode', 'Friend requests are not available yet.');
      return;
    }
    setActing(profile.id);
    try {
      assertSupabaseConfigured();
      const rpc = kind === 'Like' ? 'send_like' : 'send_secret_crush';
      const { data, error: requestError } = await supabase.rpc(rpc, {
        p_recipient_id: profile.id,
      });
      if (requestError) throw requestError;
      const result = (data as MatchActionResult[] | null)?.[0];
      setDismissed((current) => [...current, profile.id]);
      if (result?.matched) {
        Alert.alert("It's a match!", 'You both expressed interest. Your private conversation has been created.');
      } else {
        Alert.alert(
          kind === 'Like' ? 'Like sent' : 'Secret Crush sent',
          kind === 'Like'
            ? 'If they like you back, CRUSH will create a match.'
            : 'Your identity stays private unless they also choose you.',
        );
      }
    } catch {
      Alert.alert(
        'Action unavailable',
        'CRUSH could not process this action. Your account may still be awaiting age and student verification, or the service may be temporarily unavailable.',
      );
    } finally {
      setActing(null);
    }
  };

  const pass = (profile: Profile) => {
    setDismissed((current) => [...current, profile.id]);
  };

  return (
    <Screen>
      <Heading eyebrow="MEET YOUR PEOPLE" title="Discover" subtitle="Find verified friends and meaningful connections on your campus." />
      <View style={s.switch}>
        {(['Dating', 'Friends'] as Mode[]).map((item) => (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === item }}
            onPress={() => setMode(item)}
            style={[s.mode, mode === item && s.modeActive]}
          >
            <Text style={[s.modeText, mode === item && s.modeTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <Panel>
        <Text style={s.privacy}>Privacy first</Text>
        <Text style={s.tip}>Only profiles that pass CRUSH's age and UNESWA student checks can appear. Your exact location is never shown.</Text>
      </Panel>

      {loading ? (
        <Panel><ActivityIndicator color={colors.pink} /><Text style={s.tip}>Loading eligible campus profiles…</Text></Panel>
      ) : error ? (
        <Panel>
          <Text style={s.name}>Unable to load profiles</Text>
          <Text style={s.tip}>{error}</Text>
          <Pressable style={s.reset} onPress={() => void loadProfiles()}><Text style={s.likeText}>Try again</Text></Pressable>
        </Panel>
      ) : visibleProfiles.length ? visibleProfiles.map((profile) => (
        <Panel key={profile.id}>
          <View style={s.hero}>
            <View style={s.avatar}><Text style={{ fontSize: 34 }}>🌷</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{profile.display_name}</Text>
              <Text style={s.meta}>{profile.campus_name ?? 'University of Eswatini'}</Text>
            </View>
          </View>
          {profile.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}
          <View style={s.actions}>
            <Pressable accessibilityRole="button" disabled={acting !== null} style={s.pass} onPress={() => pass(profile)}>
              <Text style={s.passText}>Pass</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={acting !== null} style={s.like} onPress={() => void act('Like', profile)}>
              {acting === profile.id ? <ActivityIndicator color="white" /> : <Text style={s.likeText}>♡  Like</Text>}
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" disabled={acting !== null} onPress={() => void act('Secret Crush', profile)}>
            <Text style={s.secret}>Send a Secret Crush 💌</Text>
          </Pressable>
        </Panel>
      )) : (
        <Panel>
          <Text style={s.name}>No eligible profiles yet</Text>
          <Text style={s.tip}>
            CRUSH only shows accounts after both age and student verification are complete. There may not be verified profiles available in this discovery mode yet.
          </Text>
          <Pressable style={s.reset} onPress={() => void loadProfiles()}><Text style={s.likeText}>Refresh profiles</Text></Pressable>
        </Panel>
      )}
      <Text style={s.note}>Pass currently hides a profile for this session only. Permanent pass history, friend requests and reporting are still being developed.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  switch: { flexDirection: 'row', backgroundColor: '#F8E8F0', padding: 5, borderRadius: 14 },
  mode: { padding: 10, borderRadius: 10, flex: 1, alignItems: 'center' },
  modeActive: { backgroundColor: colors.white },
  modeText: { color: colors.muted, fontWeight: '700' },
  modeTextActive: { color: colors.pink, fontWeight: '800' },
  privacy: { fontWeight: '900', color: colors.pink },
  tip: { color: colors.muted, lineHeight: 20 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF0F6', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '900', color: colors.black },
  meta: { color: colors.muted, marginTop: 3 },
  bio: { color: colors.black, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 5 },
  pass: { flex: 1, padding: 13, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  like: { flex: 1, padding: 13, borderRadius: 12, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center', minHeight: 46 },
  passText: { fontWeight: '800', color: colors.muted },
  likeText: { fontWeight: '800', color: 'white' },
  secret: { textAlign: 'center', paddingTop: 14, color: colors.pink, fontWeight: '800' },
  reset: { marginTop: 12, backgroundColor: colors.pink, alignItems: 'center', padding: 12, borderRadius: 12 },
  note: { fontSize: 11, color: colors.muted, lineHeight: 17 },
});
