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

  useEffect(() => { void loadProfiles(); }, [loadProfiles]);
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
      const { data, error: requestError } = await supabase.rpc(rpc, { p_recipient_id: profile.id });
      if (requestError) throw requestError;
      const result = (data as MatchActionResult[] | null)?.[0];
      setDismissed((current) => [...current, profile.id]);
      if (result?.matched) Alert.alert("It's a match!", 'You both expressed interest. Your private conversation has been created.');
      else Alert.alert(kind === 'Like' ? 'Like sent' : 'Secret Crush sent', kind === 'Like' ? 'If they like you back, CRUSH will create a match.' : 'Your identity stays private unless they also choose you.');
    } catch {
      Alert.alert('Action unavailable', 'Your account may still be awaiting trusted age or UNESWA student verification, or the service may be temporarily unavailable.');
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
        p_target_user_id: reportTarget.id, p_category: reportCategory, p_details: reportDetails.trim() || null,
      });
      if (reportError) throw reportError;
      const reportedName = reportTarget.display_name;
      setReportTarget(null);
      setReportDetails('');
      Alert.alert('Report received', 'Thank you. Your report about ' + reportedName + ' was submitted privately for review.');
    } catch {
      Alert.alert('Could not submit report', 'Please check your connection and try again. Reports are limited to five per account per day.');
    } finally { setSubmittingReport(false); }
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
        } catch { Alert.alert('Could not block account', 'Please check your connection and try again.'); }
        finally { setActing(null); }
      }},
    ]);
  };

  const pass = (profile: Profile) => setDismissed((current) => [...current, profile.id]);

  return (
    <Screen>
      <Heading eyebrow="MEET YOUR PEOPLE" title="Discover" subtitle="Find verified friends and meaningful connections on your campus." />
      <View style={s.switch}>
        {(['Dating', 'Friends'] as Mode[]).map((item) => (
          <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: mode === item }} onPress={() => setMode(item)} style={[s.switchItem, mode === item && s.switchActive]}>
            <Text style={[s.switchText, mode === item && s.switchTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {loading ? <ActivityIndicator color={colors.pink} /> : error ? <Panel><Text style={s.error}>{error}</Text><Pressable onPress={loadProfiles}><Text style={s.retry}>Try again</Text></Pressable></Panel> : visibleProfiles.length === 0 ? <Panel><Text style={s.empty}>No eligible profiles are available right now.</Text></Panel> : visibleProfiles.map((profile) => (
        <Panel key={profile.id}>
          <Text style={s.name}>{profile.display_name}</Text>
          {profile.campus_name ? <Text style={s.campus}>{profile.campus_name}</Text> : null}
          {profile.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}
          <View style={s.actions}>
            <Pressable disabled={acting === profile.id} onPress={() => pass(profile)} style={s.secondary}><X color={colors.black} size={18}/><Text style={s.actionText}>Pass</Text></Pressable>
            <Pressable disabled={acting === profile.id} onPress={() => void act('Like', profile)} style={s.primary}><Heart color="white" size={18}/><Text style={s.primaryText}>Like</Text></Pressable>
            <Pressable disabled={acting === profile.id} onPress={() => void act('Secret Crush', profile)} style={s.secondary}><Send color={colors.pink} size={18}/><Text style={s.actionText}>Secret Crush</Text></Pressable>
          </View>
          <View style={s.safety}>
            <Pressable onPress={() => setReportTarget(profile)}><Text style={s.safetyLink}>Report</Text></Pressable>
            <Pressable onPress={() => blockProfile(profile)}><Text style={s.safetyLink}>Block</Text></Pressable>
          </View>
        </Panel>
      ))}
      <Modal visible={!!reportTarget} transparent animationType="fade" onRequestClose={() => setReportTarget(null)}>
        <View style={s.modalBackdrop}><View style={s.modal}>
          <Text style={s.modalTitle}>Report account</Text>
          <Text style={s.modalText}>Choose the reason that best describes the concern.</Text>
          {['harassment','impersonation','underage','spam','unsafe_content','other'].map((item) => <Pressable key={item} onPress={() => setReportCategory(item)} style={[s.reason, reportCategory === item && s.reasonActive]}><Text style={s.reasonText}>{item.replace('_',' ')}</Text></Pressable>)}
          <TextInput value={reportDetails} onChangeText={setReportDetails} multiline maxLength={4000} placeholder="Optional details" style={s.details}/>
          <Pressable disabled={submittingReport} onPress={submitReport} style={s.primary}><Text style={s.primaryText}>{submittingReport ? 'Submitting…' : 'Submit report'}</Text></Pressable>
          <Pressable onPress={() => setReportTarget(null)}><Text style={s.cancel}>Cancel</Text></Pressable>
        </View></View>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  switch:{flexDirection:'row',backgroundColor:colors.blush,borderRadius:13,padding:4,marginBottom:14},
  switchItem:{flex:1,padding:11,alignItems:'center',borderRadius:10},
  switchActive:{backgroundColor:'white'},
  switchText:{fontWeight:'800',color:colors.muted},
  switchTextActive:{color:colors.pink},
  name:{fontSize:19,fontWeight:'900',color:colors.black},
  campus:{color:colors.pink,fontWeight:'800',marginTop:4},
  bio:{color:colors.muted,lineHeight:20,marginTop:8},
  actions:{flexDirection:'row',gap:8,marginTop:15},
  primary:{backgroundColor:colors.pink,borderRadius:12,padding:12,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6,flex:1},
  primaryText:{color:'white',fontWeight:'900'},
  secondary:{backgroundColor:colors.blush,borderRadius:12,padding:12,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:5,flex:1},
  actionText:{color:colors.black,fontWeight:'800'},
  safety:{flexDirection:'row',justifyContent:'flex-end',gap:20,marginTop:12},
  safetyLink:{color:colors.muted,fontSize:12,fontWeight:'700'},
  error:{color:colors.pinkDark,lineHeight:20},
  retry:{color:colors.pink,fontWeight:'900',marginTop:10},
  empty:{color:colors.muted,textAlign:'center',padding:15},
  modalBackdrop:{flex:1,backgroundColor:'#0009',justifyContent:'center',padding:20},
  modal:{backgroundColor:'white',borderRadius:18,padding:20,gap:9},
  modalTitle:{fontSize:18,fontWeight:'900',color:colors.black},
  modalText:{color:colors.muted,lineHeight:20},
  reason:{padding:10,borderRadius:9,backgroundColor:'#FFF4F8'},
  reasonActive:{borderWidth:1,borderColor:colors.pink},
  reasonText:{color:colors.black,textTransform:'capitalize'},
  details:{minHeight:75,borderWidth:1,borderColor:colors.border,borderRadius:10,padding:10,textAlignVertical:'top'},
  cancel:{color:colors.muted,textAlign:'center',padding:8,fontWeight:'800'},
});
