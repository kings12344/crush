import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type ConversationSummary = {
  conversation_id: string;
  peer_id: string;
  peer_name: string;
  last_message: string | null;
  last_message_at: string | null;
};

export type StoredMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export async function getMyConversations(): Promise<ConversationSummary[]> {
  const { data, error } = await supabase.rpc('get_my_conversations');
  if (error) throw error;
  return (data ?? []) as ConversationSummary[];
}

export async function getConversationMessages(conversationId: string): Promise<StoredMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as StoredMessage[];
}

export async function sendConversationMessage(conversationId: string, body: string): Promise<string> {
  const { data, error } = await supabase.rpc('send_message', {
    p_conversation_id: conversationId,
    p_body: body,
  });
  if (error) throw error;
  return data as string;
}

export function subscribeToConversation(
  conversationId: string,
  onInsert: (message: StoredMessage) => void,
): RealtimeChannel {
  return supabase
    .channel(`crush-conversation-${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => onInsert(payload.new as StoredMessage),
    )
    .subscribe();
}
