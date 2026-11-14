import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/theme';

const setupSteps = [
  {
    number: '01',
    title: 'Secure sign-in',
    status: 'Not connected',
    detail: 'Choose an identity provider and connect a trusted backend before creating accounts.',
  },
  {
    number: '02',
    title: 'Age assurance',
    status: 'Not started',
    detail: 'A trusted server must confirm 18+ eligibility. A date of birth or checkbox alone is not verification.',
  },
  {
    number: '03',
    title: 'Student status',
    status: 'Not started',
    detail: 'An approved University of Eswatini process is required. A school email address alone is not proof.',
  },
];

export default function Register() {
  return (
    <Screen>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Heading eyebrow="ACCOUNT SETUP" title="Create account" subtitle="The steps below must be connected before CRUSH can safely create a real account." />

      <Panel>
        <Text style={styles.status}>Setup is not available in this prototype</Text>
        <Text style={styles.body}>
          No account is created and no information is submitted. This screen does not ask for your email, date of birth, documents, or password.
        </Text>
      </Panel>

      {setupSteps.map((step) => (
        <Panel key={step.number}>
          <Text style={styles.number}>{step.number}  ·  {step.status}</Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.detail}</Text>
        </Panel>
      ))}

      <Pressable accessibilityRole="button" style={styles.primary} onPress={() => router.push('/(auth)/verification')}>
        <Text style={styles.primaryText}>Review verification requirements</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.link}>Go to sign in</Text>
      </Pressable>
      <Text style={styles.note}>
        CRUSH must keep age and student eligibility unverified until trusted services return an authorized server-side result.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { fontSize: 17, color: colors.pink, fontWeight: '800', marginBottom: 8 },
  status: { color: colors.pink, fontSize: 16, fontWeight: '900' },
  number: { color: colors.pink, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  title: { color: colors.black, fontSize: 16, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  primary: { backgroundColor: colors.pink, padding: 16, borderRadius: 14, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '900', textAlign: 'center' },
  link: { textAlign: 'center', color: colors.pink, fontWeight: '800', padding: 12 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
