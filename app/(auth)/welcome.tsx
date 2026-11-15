import { router } from 'expo-router';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/theme';
import { Heart } from 'lucide-react-native';

export default function Welcome() {
  return (
    <Screen style={styles.wrap}>
      <View style={styles.logo}><Heart size={48} color={colors.pink} strokeWidth={2.1} /></View>
      <Text style={styles.brand}>CRUSH</Text>
      <Text style={styles.tag}>MEET YOUR PEOPLE. FIND YOUR PERSON.</Text>
      <Text style={styles.description}>A community for real friendships, meaningful connections and moments worth sharing.</Text>
      <Text style={styles.notice}>
        Create an account with a verified email. CRUSH is intended for adults aged 18 and above.
      </Text>
      <Pressable accessibilityRole="button" style={styles.primary} onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.primaryText}>Create account</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.secondaryText}>I already have an account</Text>
      </Pressable>
      <Text style={styles.legal}>Account creation does not establish age. Trusted age assurance is required before age-restricted features are enabled.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 26 },
  logo: { width: 92, height: 92, borderRadius: 30, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  heart: { fontSize: 54, color: colors.pink },
  brand: { fontSize: 44, fontWeight: '900', letterSpacing: 2, color: colors.black, marginTop: 15 },
  tag: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: colors.pink, marginTop: 6, textAlign: 'center' },
  description: { fontSize: 15, lineHeight: 23, textAlign: 'center', color: colors.muted, marginVertical: 24 },
  notice: { fontSize: 12, lineHeight: 18, color: colors.black, textAlign: 'center', backgroundColor: colors.blush, padding: 13, borderRadius: 12 },
  primary: { width: '100%', backgroundColor: colors.pink, padding: 17, borderRadius: 15, alignItems: 'center', marginTop: 18 },
  primaryText: { color: 'white', fontWeight: '900', fontSize: 16 },
  secondary: { width: '100%', padding: 16, borderRadius: 15, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginTop: 12 },
  secondaryText: { fontWeight: '800', color: colors.black },
  legal: { fontSize: 10, color: colors.muted, textAlign: 'center', lineHeight: 16, marginTop: 18 },
});
