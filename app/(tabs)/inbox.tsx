import { MessageCircle } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { colors } from '../../constants/theme';

export default function Inbox() {
  return (
    <Screen>
      <Heading eyebrow="YOUR CONVERSATIONS" title="Inbox" subtitle="Private conversations with your matches." />
      <Panel>
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
          <MessageCircle size={38} color={colors.pink} strokeWidth={1.8} />
          <Text style={{ fontSize: 17, fontWeight: '900', color: colors.black }}>No conversations yet</Text>
          <Text style={{ color: colors.muted, lineHeight: 21, textAlign: 'center' }}>
            When you make an eligible mutual match, your conversations will appear here.
          </Text>
        </View>
      </Panel>
    </Screen>
  );
}
