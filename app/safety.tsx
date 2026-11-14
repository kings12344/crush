import { Alert, Pressable, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../components/Screen';
import { Heading } from '../components/Heading';
import { Panel } from '../components/Panel';
import { colors } from '../constants/theme';
const guidance = [
  ['Keep control of personal information', 'Avoid sharing your home address, financial details, passwords, verification documents, or real-time location in a profile or chat. CRUSH does not need your password outside sign-in.'],
  ['Meet safely', 'For a first meeting, choose a public place, arrange your own transport, tell someone you trust where you are going, and leave if you feel uncomfortable.'],
  ['Respect consent and boundaries', 'A match is not consent to messages, photos, calls, or an in-person meeting. Stop contact when asked. Never pressure anyone to send intimate content.'],
  ['Block and report', 'Use report or hide on a profile to preview hiding it. In production, block must immediately prevent discovery, messages and calls in both directions; reports must be private, reviewed, and protected from the reported person.'],
];
export default function Safety() {
  return <Screen>
    <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={s.back}>‹ Back to profile</Text></Pressable>
    <Heading eyebrow="YOUR SAFETY MATTERS" title="Safety center" subtitle="Practical guidance and the controls CRUSH must enforce." />
    {guidance.map(([title, body]) => <Panel key={title}><Text style={s.title}>{title}</Text><Text style={s.body}>{body}</Text></Panel>)}
    <Panel><Text style={s.title}>Need immediate help?</Text><Text style={s.body}>If you are in immediate danger, contact local emergency services or a trusted person nearby. CRUSH is not an emergency response service.</Text></Panel>
    <Panel><Text style={s.title}>Prototype limitation</Text><Text style={s.body}>This build has no moderation team, reporting endpoint, block enforcement, live chat, or emergency support. Preview actions do not notify anyone. Do not rely on this prototype for real-world safety or account protection.</Text></Panel>
    <Pressable style={s.button} onPress={() => Alert.alert('Safety feedback unavailable', 'This prototype has no reporting backend. No report was submitted.') }><Text style={s.buttonText}>Contact safety team (not connected)</Text></Pressable>
  </Screen>;
}
const s = StyleSheet.create({ back: { color: colors.pink, fontSize: 16, fontWeight: '800' }, title: { color: colors.black, fontWeight: '900', fontSize: 16 }, body: { color: colors.muted, lineHeight: 21 }, button: { backgroundColor: colors.pink, padding: 15, borderRadius: 13, alignItems: 'center' }, buttonText: { color: 'white', fontWeight: '800' } });
