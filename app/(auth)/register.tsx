import { useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, Text, TextInput, StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { colors } from '../../constants/theme';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, ys, ms, ds] = match;
  const date = new Date(Number(ys), Number(ms) - 1, Number(ds));
  return date.getFullYear() === Number(ys) && date.getMonth() === Number(ms) - 1 && date.getDate() === Number(ds) ? date : null;
}
function ageOn(date: Date, now = new Date()): number {
  let age = now.getFullYear() - date.getFullYear();
  if (now.getMonth() < date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() < date.getDate())) age--;
  return age;
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [dob, setDob] = useState('');
  const [adult, setAdult] = useState(false);
  const submit = () => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const birth = parseDate(dob);
    if (!cleanName || cleanName.length > 40 || !emailPattern.test(normalizedEmail) || !password || !dob.trim()) {
      Alert.alert('Check your details', 'Enter a display name (up to 40 characters), a valid email, a password, and a real date of birth.'); return;
    }
    if (password.length < 12 || password.length > 128 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      Alert.alert('Choose a stronger password', 'Use 12–128 characters with at least one uppercase letter, lowercase letter, and number. A unique passphrase is best.'); return;
    }
    if (password !== confirm) { Alert.alert('Passwords do not match', 'Re-enter the same password in both fields.'); return; }
    if (!birth) { Alert.alert('Invalid date', 'Enter your date of birth as a real calendar date in YYYY-MM-DD format.'); return; }
    if (ageOn(birth) < 18) { Alert.alert('CRUSH is 18+', 'You must be at least 18 years old to create an account.'); return; }
    if (!adult) { Alert.alert('Age confirmation required', 'Please confirm that you are 18 or older.'); return; }
    Alert.alert('Secure account setup unavailable', 'This build has no authentication backend. Nothing has been sent or saved; do not enter a real password. Production must enforce age eligibility and verify email on the server.', [{ text: 'Continue demo', onPress: () => router.push('/(auth)/verification') }]);
  };
  return <Screen>
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()}><Text style={s.back}>‹ Back</Text></Pressable>
    <Heading eyebrow="JOIN THE COMMUNITY" title="Create account" subtitle="Use a unique password. CRUSH will never ask you to share it with other members." />
    <Field label="Display name" value={name} onChangeText={setName} placeholder="What should people call you?" maxLength={40} autoCapitalize="words" />
    <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" />
    <Field label="Password" value={password} onChangeText={setPassword} placeholder="12+ characters; unique to CRUSH" secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="newPassword" maxLength={128} />
    <Field label="Confirm password" value={confirm} onChangeText={setConfirm} placeholder="Re-enter password" secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="newPassword" maxLength={128} />
    <Field label="Date of birth" value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" maxLength={10} />
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: adult }} style={s.checkRow} onPress={() => setAdult(!adult)}><View style={[s.check, adult && s.checked]}>{adult ? <Text style={{ color: 'white' }}>✓</Text> : null}</View><Text style={s.checkText}>I confirm that I am at least 18 years old.</Text></Pressable>
    <Pressable accessibilityRole="button" style={s.primary} onPress={submit}><Text style={s.primaryText}>Continue</Text></Pressable>
    <Text style={s.note}>Prototype only. No account is created and no data is transmitted. Never use a real password here. Client-side age checks are not proof of age; production checks must run server-side.</Text>
  </Screen>;
}
function Field(props: any) { return <View style={{ gap: 6 }}><Text style={s.label}>{props.label}</Text><TextInput {...props} placeholderTextColor="#A59AA2" style={s.input} /></View>; }
const s = StyleSheet.create({ back: { fontSize: 17, color: colors.pink, fontWeight: '800', marginBottom: 8 }, label: { fontSize: 12, fontWeight: '800', color: colors.black }, input: { backgroundColor: 'white', borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 15, fontSize: 15, color: colors.black }, checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 }, check: { width: 23, height: 23, borderWidth: 1.5, borderColor: colors.pink, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: colors.pink }, checkText: { flex: 1, color: colors.black, fontSize: 13 }, primary: { backgroundColor: colors.pink, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 }, primaryText: { color: 'white', fontWeight: '900', fontSize: 16 }, note: { fontSize: 11, color: colors.muted, lineHeight: 17 }});
