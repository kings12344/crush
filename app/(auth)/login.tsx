import { useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, Text, TextInput, StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { colors } from '../../constants/theme';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const unavailable = () => Alert.alert('Login unavailable', 'This prototype is not connected to an authentication service. Nothing has been sent or saved; do not enter a real password.');
  return <Screen>
    <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={s.back}>‹ Back</Text></Pressable>
    <Heading eyebrow="WELCOME BACK" title="Log in" subtitle="Pick up where you left off." />
    <View style={{ gap: 6 }}><Text style={s.label}>Email address</Text><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" placeholder="you@example.com" placeholderTextColor="#A59AA2" style={s.input} /></View>
    <View style={{ gap: 6 }}><Text style={s.label}>Password</Text><TextInput value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="password" autoComplete="password" placeholder="Your password" placeholderTextColor="#A59AA2" style={s.input} /></View>
    <Pressable accessibilityRole="button" style={s.primary} onPress={unavailable}><Text style={s.primaryText}>Log in</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => Alert.alert('Password reset unavailable', 'Password reset requires a verified backend account. This prototype cannot send a reset email.')}><Text style={s.link}>Forgot password?</Text></Pressable>
    <Text style={s.note}>Prototype only. No credentials are transmitted or stored. Do not enter credentials you use elsewhere.</Text>
  </Screen>;
}
const s = StyleSheet.create({ back: { fontSize: 17, color: colors.pink, fontWeight: '800', marginBottom: 8 }, label: { fontSize: 12, fontWeight: '800' }, input: { backgroundColor: 'white', borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 15, fontSize: 15 }, primary: { backgroundColor: colors.pink, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 }, primaryText: { color: 'white', fontWeight: '900' }, link: { textAlign: 'center', color: colors.pink, fontWeight: '800', padding: 15 }, note: { color: colors.muted, fontSize: 12, lineHeight: 18 } });
