import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessagesSquare, Send, ArrowLeft, User } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { agentChat } from '@/features/chat/service';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';
import { toast } from '@/stores/toastStore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function ChatInboxPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: () => agentChat.conversations(),
    refetchInterval: 5000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['chat', 'messages', activeId],
    queryFn: () => agentChat.messages(activeId as string),
    enabled: Boolean(activeId),
    refetchInterval: activeId ? 4000 : false,
  });

  useEffect(() => {
    if (activeId) void agentChat.markRead(activeId).then(() => qc.invalidateQueries({ queryKey: ['chat', 'conversations'] }));
  }, [activeId, qc]);

  // Realtime: refresh on any chat change (with polling above as a fallback).
  useEffect(() => {
    const channel = supabase
      .channel('staff-chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
        void qc.invalidateQueries({ queryKey: ['chat'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, () => {
        void qc.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages.length]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const handleToggleStatus = async (id: string, action: 'close' | 'reopen') => {
    try {
      await (action === 'close' ? agentChat.close(id) : agentChat.reopen(id));
      await qc.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    } catch (error) {
      toast.fromError(error, 'Gagal memperbarui status');
    }
  };

  const handleReply = async () => {
    const body = reply.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    try {
      await agentChat.reply(activeId, body, profile?.id ?? null);
      setReply('');
      await qc.invalidateQueries({ queryKey: ['chat', 'messages', activeId] });
      await qc.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    } catch (error) {
      toast.fromError(error, 'Gagal mengirim balasan');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Live Chat" description="Balas pesan pengunjung website secara langsung." />

      <div className="grid h-[calc(100dvh-220px)] grid-cols-1 overflow-hidden rounded-lg border border-border md:grid-cols-[320px_1fr]">
        {/* Conversation list */}
        <aside
          className={cn(
            'flex flex-col border-r border-border bg-surface',
            activeId && 'hidden md:flex',
          )}
        >
          <div className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
            Percakapan ({conversations.length})
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Belum ada percakapan.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                    activeId === c.id && 'bg-primary-muted/60',
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <User className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {c.visitor_name || 'Pengunjung'}
                      </p>
                      {c.status === 'closed' ? (
                        <Badge tone="neutral">Ditutup</Badge>
                      ) : (
                        c.unread_for_agent > 0 && <Badge tone="danger">{c.unread_for_agent}</Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.visitor_contact || formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className={cn('flex flex-col bg-surface-sunken', !activeId && 'hidden md:flex')}>
          {!active ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState icon={MessagesSquare} title="Pilih percakapan" description="Pilih percakapan di samping untuk membalas." />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
                <button onClick={() => setActiveId(null)} className="md:hidden" aria-label="Kembali">
                  <ArrowLeft className="size-5 text-muted-foreground" />
                </button>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{active.visitor_name || 'Pengunjung'}</p>
                  {active.visitor_contact && <p className="text-xs text-muted-foreground">{active.visitor_contact}</p>}
                </div>
                {active.status === 'closed' ? (
                  <button
                    onClick={() => void handleToggleStatus(active.id, 'reopen')}
                    className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    Buka lagi
                  </button>
                ) : (
                  <button
                    onClick={() => void handleToggleStatus(active.id, 'close')}
                    className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    Tutup percakapan
                  </button>
                )}
              </div>

              <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className={cn('flex', m.sender === 'agent' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                        m.sender === 'agent'
                          ? 'rounded-br-sm bg-primary text-primary-foreground'
                          : 'rounded-bl-sm border border-border bg-surface text-foreground',
                      )}
                    >
                      {m.body}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-end gap-2 border-t border-border bg-surface p-3">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleReply();
                    }
                  }}
                  rows={1}
                  placeholder="Tulis balasan…"
                  className="max-h-28 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  onClick={() => void handleReply()}
                  disabled={sending || !reply.trim()}
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  aria-label="Kirim"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
