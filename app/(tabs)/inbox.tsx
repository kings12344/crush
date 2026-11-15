import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ChevronRight, MessageCircle } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { colors } from '../../constants/theme';
import { getMyConversations, type ConversationSummary } from '../../lib/messaging';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function Inbox() {
  const { session } = useAuth();
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!session || !isSupabaseConfigured) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setItems(await getMyConversations());
    } catch {
      setError('Your conversations could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <Screen>
      <Heading eyebrow="YOUR CONVERSATIONS" title="Inbox" subtitle="Private conversations with your mutual matches." />
      {loading ? <ActivityIndicator color={colors.pink} /> : null}
      {error ? <Text style={{ color: colors.muted, lineHeight: 21 }}>{error}</Text> : null}
      {!loading && !error && items.length === 0 ? (
        <Panel>
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
            <MessageCircle size={38} color={colors.pink} strokeWidth={1.8} />
            <Text style={{ fontSize: 17, fontWeight: '900', color: colors.black }}>No conversations yet</Text>
            <Text style={{ color: colors.muted, lineHeight: 21, textAlign: 'center' }}>
              Conversations appear here after an eligible mutual match.
            </Text>
          </View>
        </Panel>
      ) : null}
      {items.map((item) => (
        <Pressable
          key={item.conversation_id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/chat/[conversationId]', params: { conversationId: item.conversation_id } })}
          style={{ backgroundColor: colors.white, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FCE7EF', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle color={colors.pink} size={20} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: colors.black, fontSize: 15, fontWeight: '800' }}>{item.peer_name}</Text>
            <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 13 }}>
              {item.last_message || 'Say hello and start the conversation'}
            </Text>
          </View>
          <ChevronRight color={colors.muted} size={19} />
        </Pressable>
      ))}
    </Screen>
  );
}
