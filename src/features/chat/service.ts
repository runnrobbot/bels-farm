import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import type { ChatConversationRow, ChatMessageRow } from '@/types/database';

export interface ChatThread {
  status: 'open' | 'closed' | null;
  messages: Pick<ChatMessageRow, 'id' | 'sender' | 'body' | 'created_at'>[];
}

/** Visitor-facing chat operations (anon-safe, via SECURITY DEFINER RPCs). */
export const visitorChat = {
  async start(name: string, contact: string, body: string): Promise<string> {
    const { data, error } = await supabase.rpc('chat_start', {
      p_name: name,
      p_contact: contact,
      p_body: body,
    });
    if (error) throw toAppError(error);
    return data;
  },

  async post(conversationId: string, body: string): Promise<void> {
    const { error } = await supabase.rpc('chat_post', {
      p_conversation: conversationId,
      p_body: body,
    });
    if (error) throw toAppError(error);
  },

  async thread(conversationId: string): Promise<ChatThread> {
    const { data, error } = await supabase.rpc('chat_thread', { p_conversation: conversationId });
    if (error) throw toAppError(error);
    return data as unknown as ChatThread;
  },

  async close(conversationId: string): Promise<void> {
    const { error } = await supabase.rpc('chat_close', { p_conversation: conversationId });
    if (error) throw toAppError(error);
  },
};

/** Staff-facing chat operations (RLS-gated by the `chat` permission). */
export const agentChat = {
  async conversations(): Promise<ChatConversationRow[]> {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(100);
    if (error) throw toAppError(error);
    return data ?? [];
  },

  async messages(conversationId: string): Promise<ChatMessageRow[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw toAppError(error);
    return data ?? [];
  },

  async reply(conversationId: string, body: string, authorId: string | null): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .insert({ conversation_id: conversationId, sender: 'agent', body, author_id: authorId } as never);
    if (error) throw toAppError(error);
    await supabase
      .from('chat_conversations')
      .update({ last_message_at: new Date().toISOString(), unread_for_agent: 0 } as never)
      .eq('id', conversationId);
  },

  async markRead(conversationId: string): Promise<void> {
    await supabase
      .from('chat_conversations')
      .update({ unread_for_agent: 0 } as never)
      .eq('id', conversationId);
  },

  /** Close a conversation. A later visitor message reopens it (see chat_post). */
  async close(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_conversations')
      .update({ status: 'closed' } as never)
      .eq('id', conversationId);
    if (error) throw toAppError(error);
  },

  async reopen(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_conversations')
      .update({ status: 'open' } as never)
      .eq('id', conversationId);
    if (error) throw toAppError(error);
  },
};
