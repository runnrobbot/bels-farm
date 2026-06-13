import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  useNotifications,
  useMarkNotification,
  useMarkAllNotifications,
} from '@/features/notifications/service';
import { popIn } from '@/lib/animation/motion';
import { cn } from '@/lib/utils';
import type { NotificationKind, NotificationRow } from '@/types/database';

const TONE: Record<NotificationKind, string> = {
  customer: 'bg-info/12 text-info',
  payment: 'bg-success/12 text-success',
  vaccination: 'bg-primary/12 text-primary',
  birth: 'bg-accent/15 text-accent',
  stock: 'bg-warning/15 text-warning',
  task: 'bg-info/12 text-info',
  system: 'bg-muted text-muted-foreground',
};

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: notifications = [] } = useNotifications();
  const markOne = useMarkNotification();
  const markAll = useMarkAllNotifications();

  const unread = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!open) return;
    if (panelRef.current) popIn(panelRef.current);
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleClick = (n: NotificationRow) => {
    if (!n.is_read) markOne.mutate(n.id);
    if (n.link) {
      setOpen(false);
      void navigate(n.link);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={`Notifikasi${unread ? `, ${unread} belum dibaca` : ''}`}
        aria-expanded={open}
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="panel-raised absolute right-0 top-12 z-50 w-80 overflow-hidden sm:w-96"
          role="menu"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notifikasi</p>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <CheckCheck className="size-3.5" /> Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <BellOff className="size-7 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Belum ada notifikasi.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    'flex w-full gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/50',
                    !n.is_read && 'bg-primary-muted/40',
                  )}
                >
                  <span className={cn('mt-0.5 size-2 shrink-0 rounded-full', n.is_read ? 'bg-transparent' : 'bg-accent')} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={cn('rounded px-1.5 py-0.5 text-2xs font-medium capitalize', TONE[n.kind])}>
                        {n.kind}
                      </span>
                      <span className="truncate text-sm font-medium text-foreground">{n.title}</span>
                    </span>
                    {n.body && <span className="mt-0.5 block text-xs text-muted-foreground">{n.body}</span>}
                    <span className="mt-1 block text-2xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
