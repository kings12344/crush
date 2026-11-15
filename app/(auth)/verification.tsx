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
      <Heading eyebrow="ELIGIBILITY CHECK" title="Age assurance" subtitle="Age verification is not connected in this build." />

      <Panel>
        <Text style={styles.status}>Age assurance · Not verified</Text>
        <Text style={styles.body}>
          CRUSH is intended for adults aged 18 and above. A trusted provider or approved process must confirm age. Client-entered dates and checkboxes cannot grant eligibility.
        </Text>
        <Text style={styles.pending}>Age-restricted features stay locked until the server validates an authorized result.</Text>
      </Panel>

      <Panel>
        <Text style={styles.title}>Privacy</Text>
        <Text style={styles.body}>
          This screen does not collect a date of birth, identity document, or other evidence. When age assurance is configured, CRUSH should retain only the minimum outcome and reference data and apply an approved retention and deletion policy.
        </Text>
      </Panel>

      <Pressable accessibilityRole="button" accessibilityState={{ disabled: true }} disabled style={[styles.disabledButton, styles.button]}>
        <Text style={styles.disabledText}>Age verification unavailable — not submitted</Text>
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
  pending: { color: colors.black, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  button: { padding: 16, borderRadius: 14, alignItems: 'center' },
  disabledButton: { backgroundColor: '#E7DCE2' },
  disabledText: { color: '#756A71', fontWeight: '800', textAlign: 'center' },
  secondary: { borderWidth: 1, borderColor: colors.border, padding: 15, borderRadius: 14, alignItems: 'center' },
  secondaryText: { color: colors.black, fontWeight: '800' },
});
