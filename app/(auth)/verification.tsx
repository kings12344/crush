import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/theme';

export default function Verification() {
  return (
    <Screen>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Heading eyebrow="ELIGIBILITY CHECK" title="Age & student verification" subtitle="Both trusted verification processes are still being connected." />
      <Panel>
        <Text style={styles.status}>Age assurance · Pending</Text>
        <Text style={styles.body}>CRUSH is strictly for adults aged 18 and above. A trusted provider must confirm age. Client-entered dates and checkboxes cannot grant eligibility.</Text>
      </Panel>
      <Panel>
        <Text style={styles.status}>UNESWA student status · Pending</Text>
        <Text style={styles.body}>CRUSH is exclusively for current University of Eswatini students. A University-approved process must confirm current student eligibility. A student email address or client-entered student number is not sufficient proof.</Text>
      </Panel>
      <Panel>
        <Text style={styles.title}>Privacy</Text>
        <Text style={styles.body}>This screen does not collect a date of birth, identity document, student number or other evidence. Future integrations should retain only the minimum verification outcome and provider reference required for eligibility.</Text>
      </Panel>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: true }} disabled style={[styles.disabledButton, styles.button]}>
        <Text style={styles.disabledText}>Verification unavailable — not submitted</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => router.replace('/(auth)/welcome')}>
        <Text style={styles.secondaryText}>Return to welcome</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { fontSize: 17, color: colors.pink, fontWeight: '800', marginBottom: 8 },
  status: { color: colors.pink, fontSize: 16, fontWeight: '900' },
  title: { color: colors.black, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  button: { padding: 16, borderRadius: 14, alignItems: 'center' },
  disabledButton: { backgroundColor: '#E7DCE2' },
  disabledText: { color: '#756A71', fontWeight: '800', textAlign: 'center' },
  secondary: { borderWidth: 1, borderColor: colors.border, padding: 15, borderRadius: 14, alignItems: 'center' },
  secondaryText: { color: colors.black, fontWeight: '800' },
});
