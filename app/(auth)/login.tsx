import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/theme';

export default function Login() {
  return (
    <Screen>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Heading eyebrow="ACCOUNT ACCESS" title="Sign in" subtitle="Use CRUSH only after secure account services are connected." />

      <Panel>
        <Text style={styles.status}>Sign-in is not configured</Text>
        <Text style={styles.body}>
          CRUSH is not connected to an identity provider or trusted backend. You cannot sign in or recover an account from this build.
        </Text>
        <Text style={styles.body}>
          No email or password is requested, transmitted, or saved here. Never enter a password you use elsewhere.
        </Text>
      </Panel>

      <Panel>
        <Text style={styles.step}>What must be connected first</Text>
        <Text style={styles.body}>• A supported identity provider with production account access.</Text>
        <Text style={styles.body}>• A server that validates provider sessions and enforces account eligibility.</Text>
        <Text style={styles.body}>• Secure recovery, session revocation, and abuse protections.</Text>
      </Panel>

      <Pressable accessibilityRole="button" style={styles.primary} onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.primaryText}>View account setup</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.replace('/(auth)/welcome')}>
        <Text style={styles.link}>Back to welcome</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { fontSize: 17, color: colors.pink, fontWeight: '800', marginBottom: 8 },
  status: { color: colors.pink, fontSize: 17, fontWeight: '900' },
  step: { color: colors.black, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  primary: { backgroundColor: colors.pink, padding: 16, borderRadius: 14, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '900' },
  link: { textAlign: 'center', color: colors.pink, fontWeight: '800', padding: 12 },
});
