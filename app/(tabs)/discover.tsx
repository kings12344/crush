import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, TextInput, Text, View, Pressable, StyleSheet } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { colors } from '../../constants/theme';
import { Heart, X, Send } from 'lucide-react-native';
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
  const [reportTarget, setReportTarget] = useState<Profile | null>(null);
  const [reportCategory, setReportCategory] = useState('harassment');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

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
      setError('CRUSH could not load eligible UNESWA student profiles. Check your connection and backend configuration, then try again.');
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
        'CRUSH could not process this action. Your account may still be awaiting trusted age or UNESWA student verification, or the service may be temporarily unavailable.',
      );
    } finally {
      setActing(null);
    }
  };

  const submitReport = async () => {
    if (!reportTarget || submittingReport) return;
    setSubmittingReport(true);
    try {
      assertSupabaseConfigured();
      const { error: reportError } = await supabase.rpc('submit_report', {
        p_target_user_id: reportTarget.id,
        p_category: reportCategory,
        p_details: reportDetails.trim() || null,
      });
      if (reportError) throw reportError;
      const reportedName = reportTarget.display_name;
      setReportTarget(null);
      setReportDetails('');
      Alert.alert('Report received', 'Thank you. Your report about ' + reportedName + ' was submitted privately for review.');
    } catch {
      Alert.alert('Could not submit report', 'Please check your connection and try again. Reports are limited to five per account per day.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const blockProfile = (profile: Profile) => {
    Alert.alert('Block this account?', profile.display_name + ' will no longer appear in your discovery, and the server will prevent messages between your accounts. You can unblock them in Safety Center.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block account', style: 'destructive', onPress: async () => {
        setActing(profile.id);
        try {
          assertSupabaseConfigured();
          const { error: requestError } = await supabase.rpc('block_user', { p_blocked_user_id: profile.id });
          if (requestError) throw requestError;
          setProfiles((current) => current.filter((item) => item.id !== profile.id));
          setDismissed((current) => current.filter((id) => id !== profile.id));
          Alert.alert('Account blocked', 'This account has been blocked. You can manage blocked accounts in Safety Center.');
        } catch {
          Alert.alert('Could not block account', 'Please check your connection and try again.');
        } finally {
          setActing(null);
        }
      }},
    ]);
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
        <Text style={s.tip}>Only profiles that pass CRUSH's trusted 18+ age check can appear. Your exact location is never shown.</Text>
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
          {mode === 'Dating' ? (
            <>
              <View style={s.actions}>
                <Pressable accessibilityRole="button" disabled={acting !== null} style={s.pass} onPress={() => pass(profile)}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><X size={17} color={colors.muted} /><Text style={s.passText}>Pass</Text></View>
                </Pressable>
                <Pressable accessibilityRole="button" disabled={acting !== null} style={s.like} onPress={() => void act('Like', profile)}>
                  {acting === profile.id ? <ActivityIndicator color="white" /> : <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Heart size={17} color="white" /><Text style={s.likeText}>Like</Text></View>}
                </Pressable>
              </View>
              <Pressable accessibilityRole="button" disabled={acting !== null} onPress={() => void act('Secret Crush', profile)}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingTop: 14 }}><Send size={16} color={colors.pink} /><Text style={[s.secret, { paddingTop: 0 }]}>Send a Secret Crush</Text></View>
              </Pressable>
            </>
          ) : (
            <Text style={s.tip}>Friend requests are not available yet. Browsing does not send a request.</Text>
          )}
          <Pressable accessibilityRole="button" disabled={acting !== null || submittingReport} onPress={() => { setReportTarget(profile); setReportCategory('harassment'); setReportDetails(''); }}>
            <Text style={s.reportLink}>Report this profile</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={acting !== null || submittingReport} onPress={() => blockProfile(profile)}>
            <Text style={s.reportLink}>Block this account</Text>
          </Pressable>
        </Panel>
      )) : (
        <Panel>
          <Text style={s.name}>No eligible profiles yet</Text>
          <Text style={s.tip}>
            CRUSH only shows accounts after trusted 18+ age assurance is complete. There may not be age-verified profiles available in this discovery mode yet.
          </Text>
          <Pressable style={s.reset} onPress={() => void loadProfiles()}><Text style={s.likeText}>Refresh profiles</Text></Pressable>
        </Panel>
      )}
      <Text style={s.note}>Pass currently hides a profile for this session only. Use Report this profile to privately flag safety concerns for review.</Text>
      <Modal visible={reportTarget !== null} transparent animationType="slide" onRequestClose={() => { if (!submittingReport) setReportTarget(null); }}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={s.modalTitle}>Report profile</Text>
              <Text style={s.tip}>Your report about {reportTarget?.display_name ?? 'this account'} is private. Choose the reason that best describes the concern.</Text>
              {[
                ['harassment', 'Harassment or bullying'],
                ['impersonation', 'Fake profile or impersonation'],
                ['underage', 'Possible underage account'],
                ['spam', 'Spam or scams'],
                ['unsafe_content', 'Unsafe or inappropriate content'],
                ['other', 'Something else'],
              ].map(([value, label]) => (
                <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: reportCategory === value }} style={[s.category, reportCategory === value && s.categorySelected]} onPress={() => setReportCategory(value)}>
                  <Text style={[s.categoryText, reportCategory === value && s.categoryTextSelected]}>{reportCategory === value ? '●  ' : '○  '}{label}</Text>
                </Pressable>
              ))}
              <Text style={s.fieldLabel}>Additional details (optional)</Text>
              <TextInput value={reportDetails} onChangeText={setReportDetails} maxLength={4000} multiline textAlignVertical="top" placeholder="Tell us what happened. Avoid sharing passwords or unnecessary personal information." placeholderTextColor={colors.muted} style={s.reportInput} editable={!submittingReport} />
              <Text style={s.characterCount}>{reportDetails.length}/4000</Text>
              <Pressable accessibilityRole="button" disabled={submittingReport} style={[s.submitReport, submittingReport && s.disabledButton]} onPress={() => void submitReport()}>
                {submittingReport ? <ActivityIndicator color="white" /> : <Text style={s.submitReportText}>Submit report</Text>}
              </Pressable>
              <Pressable accessibilityRole="button" disabled={submittingReport} style={s.cancelReport} onPress={() => setReportTarget(null)}><Text style={s.cancelReportText}>Cancel</Text></Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  reportLink: { textAlign: 'center', color: '#A33D57', fontWeight: '800', paddingTop: 16, paddingBottom: 3 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20,12,18,0.55)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, maxHeight: '88%' },
  modalTitle: { fontSize: 22, fontWeight: '900', color: colors.black, marginBottom: 8 },
  category: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, marginTop: 8 },
  categorySelected: { borderColor: colors.pink, backgroundColor: '#FFF0F6' },
  categoryText: { color: colors.black, fontWeight: '700' },
  categoryTextSelected: { color: colors.pink },
  fieldLabel: { color: colors.black, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  reportInput: { minHeight: 104, maxHeight: 180, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.black },
  characterCount: { color: colors.muted, textAlign: 'right', fontSize: 11, marginTop: 5 },
  submitReport: { backgroundColor: colors.pink, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 14, minHeight: 48, justifyContent: 'center' },
  disabledButton: { opacity: 0.6 },
  submitReportText: { color: 'white', fontWeight: '900' },
  cancelReport: { padding: 14, alignItems: 'center' },
  cancelReportText: { color: colors.muted, fontWeight: '800' },
});
