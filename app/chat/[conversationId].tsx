import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Chat, type IMessage } from '@kesha-antonov/react-native-chat';
import { ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../constants/theme';
import {
  getConversationMessages,
  getMyConversations,
  sendConversationMessage,
  subscribeToConversation,
  type ConversationSummary,
  type StoredMessage,
} from '../../lib/messaging';
import { isSupabaseConfigured } from '../../lib/supabase';

function toChatMessage(row: StoredMessage, currentUserId: string, peerName: string): IMessage {
  const mine = row.sender_id === currentUserId;
  return {
    _id: row.id,
    text: row.body,
    createdAt: new Date(row.created_at),
    user: { _id: row.sender_id, name: mine ? 'You' : peerName },
    sent: true,
  };
}

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { session } = useAuth();
  const [conversation, setConversation] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUserId = session?.user.id ?? '';

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof subscribeToConversation> | undefined;

    const initialise = async () => {
      if (!session || !isSupabaseConfigured || typeof conversationId !== 'string') {
        setError('Sign in to open this conversation.');
        setLoading(false);
        return;
      }
      try {
        const conversations = await getMyConversations();
        const found = conversations.find((item) => item.conversation_id === conversationId);
        if (!found) throw new Error('Conversation unavailable');
        if (!active) return;
        setConversation(found);
        const rows = await getConversationMessages(conversationId);
        if (!active) return;
        setMessages(rows.map((row) => toChatMessage(row, currentUserId, found.peer_name)));
        channel = subscribeToConversation(conversationId, (row) => {
          if (!active) return;
          const next = toChatMessage(row, currentUserId, found.peer_name);
          setMessages((current) => current.some((message) => String(message._id) === row.id)
            ? current
            : [next, ...current]);
        });
      } catch {
        if (active) setError('This conversation is unavailable. It may have been closed for safety.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void initialise();
    return () => {
      active = false;
      if (channel) void channel.unsubscribe();
    };
  }, [conversationId, currentUserId, session]);

  const handleSend = useCallback(async (outgoing: IMessage[] = []) => {
    const message = outgoing[0];
    if (!message || !conversationId || typeof conversationId !== 'string' || !conversation) return;
    setError('');
    try {
      const messageId = await sendConversationMessage(conversationId, message.text);
      const confirmed: IMessage = {
        ...message,
        _id: messageId,
        createdAt: new Date(),
        user: { _id: currentUserId, name: 'You' },
        sent: true,
        pending: false,
      };
      setMessages((current) => current.some((item) => String(item._id) === messageId)
        ? current
        : [confirmed, ...current]);
    } catch {
      setError('Message not sent. Check your connection or conversation access and try again.');
    }
  }, [conversationId, conversation, currentUserId]);

  const chatUser = useMemo(() => ({ _id: currentUserId, name: 'You' }), [currentUserId]);

  if (loading) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
      <ActivityIndicator color={colors.pink} />
    </SafeAreaView>;
  }

  if (error && !conversation) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 20, justifyContent: 'center', gap: 16 }}>
      <Text style={{ color: colors.black, fontSize: 16 }}>{error}</Text>
      <Pressable onPress={() => router.back()}><Text style={{ color: colors.pink, fontWeight: '800' }}>Go back</Text></Pressable>
    </SafeAreaView>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to inbox" onPress={() => router.back()} hitSlop={10}>
          <ChevronLeft color={colors.black} size={25} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.black, fontSize: 17, fontWeight: '900' }}>{conversation?.peer_name}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Private mutual-match conversation</Text>
        </View>
      </View>
      {error ? <Text style={{ color: colors.pink, paddingHorizontal: 16, paddingBottom: 8 }}>{error}</Text> : null}
      <View style={{ flex: 1 }}>
        <Chat
          messages={messages}
          onSend={handleSend}
          user={chatUser}
          attachments={false}
          emojiKeyboard={false}
          colorScheme="light"
        />
      </View>
    </SafeAreaView>
  );
}
