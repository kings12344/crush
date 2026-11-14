import { useState } from 'react';
import { Alert, Pressable, Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { colors } from '../../constants/theme';
export default function Profile() {
  const [discoverable, setDiscoverable] = useState(true);
  const [dating, setDating] = useState(true);
  const [friends, setFriends] = useState(true);
  const [readReceipts, setReadReceipts] = useState(false);
  const toggle = (label: string, value: boolean, set: (v: boolean) => void) => <Pressable key={label} accessibilityRole="switch" accessibilityState={{ checked: value }} style={s.row} onPress={() => set(!value)}><View style={{ flex: 1 }}><Text style={s.item}>{label}</Text><Text style={s.sub}>{label === 'Discoverable' ? 'Show your profile in discovery (preview only).' : label === 'Read receipts' ? 'Let matches know when you’ve read a message.' : 'Choose which connections you want to explore.'}</Text></View><View style={[s.switch, value && s.switchOn]}><View style={[s.knob, value && s.knobOn]} /></View></Pressable>;
  return <Screen><Heading eyebrow="YOUR SPACE" title="Profile" subtitle="Your CRUSH identity, your rules." />
    <Panel><View style={s.avatar}><Text style={{ fontSize: 42 }}>🌷</Text></View><Text style={s.name}>Your profile</Text><Text style={s.muted}>Set up your display name, photos, interests and campus details when account creation is implemented.</Text></Panel>
    <Heading eyebrow="CONTROL" title="Privacy preview" subtitle="These switches demonstrate intended controls; they are not saved to an account." />
    <Panel>{toggle('Discoverable', discoverable, setDiscoverable)}{toggle('Dating mode', dating, setDating)}{toggle('Friends mode', friends, setFriends)}{toggle('Read receipts', readReceipts, setReadReceipts)}</Panel>
    <Pressable accessibilityRole="button" onPress={() => router.push('/safety')}><Panel><Text style={s.item}>Safety center  ›</Text><Text style={s.sub}>Blocking, reporting, privacy and safer-meetup guidance.</Text></Panel></Pressable>
    {['Edit profile','Verification status','Notifications','Help and support','Account settings'].map(x => <Pressable key={x} onPress={() => Alert.alert(x, 'This feature will be connected after secure account services are implemented.')}><Panel><Text style={s.item}>{x}  ›</Text></Panel></Pressable>)}
    <Pressable onPress={() => Alert.alert('Account deletion', 'Account deletion will be available once backend accounts exist. Production must provide deletion and data-export controls.') }><Text style={s.delete}>Account deletion and data export</Text></Pressable>
  </Screen>;
}
const s = StyleSheet.create({ avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#FFF0F6', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }, name: { fontSize: 20, fontWeight: '900', textAlign: 'center', color: colors.black }, muted: { color: colors.muted, textAlign: 'center', lineHeight: 21 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderColor: colors.border }, item: { fontWeight: '800', color: colors.black }, sub: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3 }, switch: { width: 46, height: 27, borderRadius: 14, backgroundColor: '#D9D4D7', padding: 3, justifyContent: 'center' }, switchOn: { backgroundColor: colors.pink }, knob: { width: 21, height: 21, borderRadius: 11, backgroundColor: 'white' }, knobOn: { alignSelf: 'flex-end' }, delete: { textAlign: 'center', color: colors.pink, fontWeight: '800', padding: 12 } });
