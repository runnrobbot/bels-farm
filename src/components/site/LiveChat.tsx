import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquareText, X, Send, Headset, RotateCcw } from 'lucide-react';
import { visitorChat } from '@/features/chat/service';
import { SITE, waMessage, WA_PRESETS } from '@/features/marketing/site';
import { toast } from '@/stores/toastStore';
import { anime, prefersReducedMotion } from '@/lib/animation/motion';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'bels-chat-id';

/**
 * On-site live chat widget. Visitors talk to staff without leaving the page;
 * messages persist to Supabase via anon-safe RPCs. Polls the thread for staff
 * replies + status. Either side can close a conversation; a closed thread locks
 * sending until the visitor starts a new chat (or staff reopens).
 */
export function LiveChat() {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  );
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const { data: thread, refetch } = useQuery({
    queryKey: ['chat', 'thread', conversationId],
    queryFn: () => visitorChat.thread(conversationId as string),
    enabled: open && Boolean(conversationId),
    refetchInterval: open && conversationId ? 3000 : false,
  });

  const messages = thread?.messages ?? [];
  const closed = thread?.status === 'closed';

  useEffect(() => {
    const el = buttonRef.current;
    if (!el || prefersReducedMotion() || open) return;
    const a = anime({
      targets: el,
      scale: [1, 1.06],
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
      duration: 1500,
    });
    return () => a.pause();
  }, [open]);

  useEffect(() => {
    if (open && panelRef.current && !prefersReducedMotion()) {
      anime({
        targets: panelRef.current,
        translateY: [24, 0],
        scale: [0.96, 1],
        opacity: [0, 1],
        duration: 320,
        easing: 'cubicBezier(0.16, 1, 0.3, 1)',
      });
    }
  }, [open]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages.length, open]);

  const send = async () => {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      if (!conversationId) {
        const id = await visitorChat.start(name, contact, body);
        localStorage.setItem(STORAGE_KEY, id);
        setConversationId(id);
      } else {
        await visitorChat.post(conversationId, body);
      }
      setInput('');
      await refetch();
    } catch (error) {
      toast.fromError(error, 'Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  const startNew = () => {
    localStorage.removeItem(STORAGE_KEY);
    setConversationId(null);
    setInput('');
    setName('');
    setContact('');
  };

  const closeConversation = async () => {
    if (!conversationId) return;
    try {
      await visitorChat.close(conversationId);
      await refetch();
    } catch (error) {
      toast.fromError(error, 'Gagal menutup percakapan');
    }
  };

  return (
    <>
      {!open && (
        <button
          ref={buttonRef}
          onClick={() => setOpen(true)}
          aria-label="Buka live chat"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-site-moss px-4 py-3.5 font-medium text-site-paper shadow-lg sm:bottom-7 sm:right-7"
        >
          <MessageSquareText className="size-6" />
          <span className="hidden text-sm sm:inline">Live Chat</span>
        </button>
      )}

      {open && (
        <div
          ref={panelRef}
          className="fixed inset-x-3 bottom-3 z-50 flex max-h-[80dvh] flex-col overflow-hidden rounded-2xl border border-site-line bg-site-paper shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[32rem] sm:w-96"
          role="dialog"
          aria-label="Live chat"
        >
          <div className="flex items-center justify-between gap-3 bg-site-moss px-4 py-3.5 text-site-paper">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-site-paper/15">
                <Headset className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{SITE.name}</p>
                <p className="text-2xs text-site-paper/75">
                  {closed ? 'Percakapan ditutup' : 'Biasanya membalas cepat'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {conversationId && !closed && (
                <button
                  onClick={() => void closeConversation()}
                  className="rounded-md px-2 py-1 text-2xs hover:bg-site-paper/15"
                >
                  Tutup
                </button>
              )}
              <button onClick={() => setOpen(false)} className="rounded-md p-1.5 hover:bg-site-paper/15" aria-label="Sembunyikan">
                <X className="size-5" />
              </button>
            </div>
          </div>

          <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto bg-site-cream p-4">
            {!conversationId && (
              <div className="rounded-xl border border-site-line bg-site-paper p-4 text-sm text-site-ink-soft">
                Halo! 👋 Ada yang bisa kami bantu soal sapi, kambing, atau domba? Tinggalkan pesan,
                tim kami akan membalas di sini.
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={cn('flex', m.sender === 'visitor' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm',
                    m.sender === 'visitor'
                      ? 'rounded-br-sm bg-site-moss text-site-paper'
                      : 'rounded-bl-sm border border-site-line bg-site-paper text-site-ink',
                  )}
                >
                  {m.body}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-site-line bg-site-paper p-3">
            {closed ? (
              <div className="text-center">
                <p className="mb-2 text-sm text-site-ink-soft">Percakapan ini sudah ditutup.</p>
                <button
                  onClick={startNew}
                  className="inline-flex items-center gap-2 rounded-full bg-site-moss px-4 py-2.5 text-sm font-medium text-site-paper hover:bg-site-moss-dark"
                >
                  <RotateCcw className="size-4" /> Mulai chat baru
                </button>
              </div>
            ) : (
              <>
                {!conversationId && (
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama (opsional)"
                      className="rounded-lg border border-site-line bg-site-cream px-3 py-2 text-sm text-site-ink focus:border-site-moss focus:outline-none"
                    />
                    <input
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="No. WA (opsional)"
                      className="rounded-lg border border-site-line bg-site-cream px-3 py-2 text-sm text-site-ink focus:border-site-moss focus:outline-none"
                    />
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    rows={1}
                    placeholder="Tulis pesan…"
                    className="max-h-24 flex-1 resize-none rounded-lg border border-site-line bg-site-cream px-3 py-2 text-sm text-site-ink focus:border-site-moss focus:outline-none"
                  />
                  <button
                    onClick={() => void send()}
                    disabled={sending || !input.trim()}
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-site-moss text-site-paper transition-colors hover:bg-site-moss-dark disabled:opacity-50"
                    aria-label="Kirim"
                  >
                    <Send className="size-4" />
                  </button>
                </div>
                <a
                  href={waMessage(WA_PRESETS.general)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-center text-2xs text-site-ink-soft hover:text-site-moss"
                >
                  Atau hubungi via WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
