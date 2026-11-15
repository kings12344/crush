import { Heart } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { colors } from '../../constants/theme';

export default function Matches() {
  return (
    <Screen>
      <Heading eyebrow="MUTUAL CONNECTIONS" title="Matches" subtitle="Your mutual connections will appear here." />
      <Panel>
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
          <Heart size={40} color={colors.pink} strokeWidth={1.8} />
          <Text style={{ fontSize: 17, fontWeight: '900', color: colors.black, textAlign: 'center' }}>
            Your story starts with a mutual like.
          </Text>
          <Text style={{ color: colors.muted, lineHeight: 21, textAlign: 'center' }}>
            Secret Crush identities stay private unless both people express interest. Matching will be connected to the backend.
          </Text>
        </View>
      </Panel>
    </Screen>
  );
}
