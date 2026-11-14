import { useMemo, useState } from 'react';
import { Alert, Text, View, Pressable, StyleSheet } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { demoProfiles } from '../../data/demo';
import { colors } from '../../constants/theme';
type Mode = 'Dating' | 'Friends';
export default function Discover() {
  const [mode, setMode] = useState<Mode>('Dating');
  const [hidden, setHidden] = useState<string[]>([]);
  const visible = useMemo(() => demoProfiles.filter(p => !hidden.includes(p.id)), [hidden]);
  const action = (kind: 'Like' | 'Pass', person: string) => {
    setHidden(list => [...list, person]);
    Alert.alert(`${kind} recorded in preview`, 'This is sample content. No like, match, or profile activity was sent or saved.');
  };
  const report = (person: string) => Alert.alert('Report this demo profile?', 'In production, reporting should send a private report to trained moderators and hide the profile from you.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Preview hide', style: 'destructive', onPress: () => setHidden(list => [...list, person]) }]);
  return <Screen>
    <Heading eyebrow="MEET YOUR PEOPLE" title="Discover" subtitle="Find friends and meaningful connections on your campus." />
    <View style={s.switch}>{(['Dating', 'Friends'] as Mode[]).map(x => <Pressable key={x} accessibilityRole="tab" accessibilityState={{ selected: mode === x }} onPress={() => setMode(x)} style={[s.mode, mode === x && s.modeActive]}><Text style={[s.modeText, mode === x && s.modeTextActive]}>{x}</Text></Pressable>)}</View>
    <Panel><Text style={s.privacy}>Privacy first</Text><Text style={s.tip}>Your exact location is never shown. Only interact with people you feel comfortable with; blocking and reporting should always be easy to find.</Text></Panel>
    {visible.length ? visible.map(p => <Panel key={p.id}>
      <View style={s.hero}><Text style={{ fontSize: 56 }}>{p.emoji}</Text><View style={{ flex: 1 }}><Text style={s.name}>{p.name}, {p.age}</Text><Text style={s.meta}>{p.course} · {p.campus}</Text></View></View>
      <Text style={s.bio}>{p.bio}</Text><Text style={s.tags}>{p.interests.map(x => '#' + x).join('  ')}</Text>
      <View style={s.actions}><Pressable accessibilityRole="button" style={s.pass} onPress={() => action('Pass', p.id)}><Text style={s.passText}>Pass</Text></Pressable><Pressable accessibilityRole="button" style={s.like} onPress={() => action('Like', p.id)}><Text style={s.likeText}>♡  Like</Text></Pressable></View>
      <Pressable accessibilityRole="button" onPress={() => report(p.id)}><Text style={s.report}>Report or hide profile</Text></Pressable>
    </Panel>) : <Panel><Text style={s.name}>You’re all caught up</Text><Text style={s.tip}>You can reset the preview to see the sample profiles again.</Text><Pressable style={s.reset} onPress={() => setHidden([])}><Text style={s.likeText}>Reset demo</Text></Pressable></Panel>}
    <Text style={s.note}>Demo profiles only. Likes, passes, and reports are local preview actions and do not contact anyone. Dating and Friends modes currently show the same sample set.</Text>
  </Screen>;
}
const s = StyleSheet.create({ switch: { flexDirection: 'row', backgroundColor: '#F8E8F0', padding: 5, borderRadius: 14 }, mode: { padding: 10, borderRadius: 10, flex: 1, alignItems: 'center' }, modeActive: { backgroundColor: colors.white }, modeText: { color: colors.muted, fontWeight: '700' }, modeTextActive: { color: colors.pink, fontWeight: '800' }, privacy: { fontWeight: '900', color: colors.pink }, tip: { color: colors.muted, lineHeight: 20 }, hero: { flexDirection: 'row', alignItems: 'center', gap: 14 }, name: { fontSize: 20, fontWeight: '900', color: colors.black }, meta: { color: colors.muted, marginTop: 3 }, bio: { color: colors.black, lineHeight: 21 }, tags: { color: colors.pink, fontWeight: '700' }, actions: { flexDirection: 'row', gap: 10, marginTop: 5 }, pass: { flex: 1, padding: 13, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }, like: { flex: 1, padding: 13, borderRadius: 12, backgroundColor: colors.pink, alignItems: 'center' }, passText: { fontWeight: '800', color: colors.muted }, likeText: { fontWeight: '800', color: 'white' }, report: { textAlign: 'center', paddingTop: 12, color: colors.pink, fontWeight: '700' }, reset: { marginTop: 12, backgroundColor: colors.pink, alignItems: 'center', padding: 12, borderRadius: 12 }, note: { fontSize: 11, color: colors.muted, lineHeight: 17 } });
