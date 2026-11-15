import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Heart, MessageCircle, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { colors } from '../../constants/theme';
import { getMyConversations, type ConversationSummary } from '../../lib/messaging';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function Matches() {
  const { session } = useAuth();
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMatches = useCallback(async () => {
    if (!session || !isSupabaseConfigured) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      // This RPC returns only the caller's active, age-verified,
      // mutual-match conversations that remain available under block rules.
      setItems(await getMyConversations());
    } catch {
      setError('Your matches could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  return (
    <Screen>
      <Heading
        eyebrow="MUTUAL CONNECTIONS"
        title="Matches"
        subtitle="People who have mutually chosen to connect with you."
      />

      {loading ? <ActivityIndicator color={colors.pink} /> : null}

      {error ? (
        <Panel>
          <Text style={{ color: colors.muted, lineHeight: 21 }}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadMatches()}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 14 }}
          >
            <RefreshCw size={16} color={colors.pink} />
            <Text style={{ color: colors.pink, fontWeight: '900' }}>Try again</Text>
          </Pressable>
        </Panel>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <Panel>
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
            <Heart size={40} color={colors.pink} strokeWidth={1.8} />
            <Text style={{ fontSize: 17, fontWeight: '900', color: colors.black, textAlign: 'center' }}>
              Your first mutual match is waiting.
            </Text>
            <Text style={{ color: colors.muted, lineHeight: 21, textAlign: 'center' }}>
              When someone you like chooses you too, your connection will appear here.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/discover')}
              style={{ backgroundColor: colors.pink, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, marginTop: 4 }}
            >
              <Text style={{ color: 'white', fontWeight: '900' }}>Explore people</Text>
            </Pressable>
          </View>
        </Panel>
      ) : null}

      {items.map((item) => (
        <Pressable
          key={item.conversation_id}
          accessibilityRole="button"
          accessibilityLabel={`Open match with ${item.peer_name}`}
          onPress={() => router.push({
            pathname: '/chat/[conversationId]',
            params: { conversationId: item.conversation_id },
          })}
        >
          <Panel>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FCE7EF', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={21} color={colors.pink} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: colors.black, fontSize: 16, fontWeight: '900' }}>{item.peer_name}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>MUTUAL MATCH</Text>
                <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 13 }}>
                  {item.last_message || 'Say hello and start your conversation'}
                </Text>
              </View>
              <MessageCircle size={19} color={colors.pink} />
            </View>
          </Panel>
        </Pressable>
      ))}
    </Screen>
  );
}
