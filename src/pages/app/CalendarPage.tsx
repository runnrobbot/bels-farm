import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Syringe, Baby, ListChecks, CalendarClock } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  format,
} from 'date-fns';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { cn } from '@/lib/utils';

type EventType = 'task' | 'vaccination' | 'breeding' | 'event';

interface CalEvent {
  date: string; // yyyy-MM-dd
  title: string;
  type: EventType;
}

const TYPE_META: Record<EventType, { tone: string; icon: typeof Syringe }> = {
  task: { tone: 'bg-info/15 text-info', icon: ListChecks },
  vaccination: { tone: 'bg-primary/15 text-primary', icon: Syringe },
  breeding: { tone: 'bg-accent/15 text-accent', icon: Baby },
  event: { tone: 'bg-warning/15 text-warning', icon: CalendarClock },
};

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function useCalendarEvents(monthStart: Date, monthEnd: Date) {
  const from = format(monthStart, 'yyyy-MM-dd');
  const to = format(monthEnd, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['calendar', from, to],
    queryFn: async (): Promise<CalEvent[]> => {
      const [tasks, health, breeding, events] = await Promise.all([
        supabase.from('tasks').select('title, due_at').not('due_at', 'is', null).gte('due_at', from).lte('due_at', `${to}T23:59:59`).is('deleted_at', null),
        supabase.from('health_records').select('title, next_due_at').not('next_due_at', 'is', null).gte('next_due_at', from).lte('next_due_at', to).is('deleted_at', null),
        supabase.from('breeding_records').select('expected_due_at').not('expected_due_at', 'is', null).gte('expected_due_at', from).lte('expected_due_at', to).is('deleted_at', null),
        supabase.from('calendar_events').select('title, starts_at').gte('starts_at', from).lte('starts_at', `${to}T23:59:59`).is('deleted_at', null),
      ]);
      if (tasks.error) throw toAppError(tasks.error);

      const out: CalEvent[] = [];
      for (const t of tasks.data ?? []) if (t.due_at) out.push({ date: t.due_at.slice(0, 10), title: t.title, type: 'task' });
      for (const h of health.data ?? []) if (h.next_due_at) out.push({ date: h.next_due_at.slice(0, 10), title: h.title, type: 'vaccination' });
      for (const b of breeding.data ?? []) if (b.expected_due_at) out.push({ date: b.expected_due_at.slice(0, 10), title: 'Perkiraan kelahiran', type: 'breeding' });
      for (const e of events.data ?? []) if (e.starts_at) out.push({ date: e.starts_at.slice(0, 10), title: e.title, type: 'event' });
      return out;
    },
  });
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd]);

  const { data: events = [] } = useCalendarEvents(gridStart, gridEnd);

  const byDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  return (
    <div>
      <PageHeader
        title="Kalender"
        description="Jadwal vaksinasi, perkiraan kelahiran, tugas, dan kegiatan operasional."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCursor((c) => addMonths(c, -1))} aria-label="Bulan sebelumnya">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-32 text-center text-sm font-semibold capitalize text-foreground">
              {format(cursor, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Bulan berikutnya">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {(Object.keys(TYPE_META) as EventType[]).map((t) => {
          const M = TYPE_META[t];
          const labels = { task: 'Tugas', vaccination: 'Vaksinasi', breeding: 'Kelahiran', event: 'Kegiatan' };
          return (
            <span key={t} className="inline-flex items-center gap-1.5">
              <span className={cn('flex size-5 items-center justify-center rounded', M.tone)}>
                <M.icon className="size-3" />
              </span>
              {labels[t]}
            </span>
          );
        })}
      </div>

      <div className="panel overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b border-border bg-surface-sunken">
          {DAY_LABELS.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayEvents = byDay.get(key) ?? [];
            const inMonth = isSameMonth(day, cursor);
            const today = isSameDay(day, new Date());
            return (
              <div
                key={key}
                className={cn(
                  'min-h-24 border-b border-r border-border/60 p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0',
                  !inMonth && 'bg-surface-sunken/40',
                )}
              >
                <div className="mb-1 flex justify-end">
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full text-xs',
                      today ? 'bg-primary font-semibold text-primary-foreground' : inMonth ? 'text-foreground' : 'text-muted-foreground/50',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((e, i) => {
                    const M = TYPE_META[e.type];
                    return (
                      <div key={i} className={cn('flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-2xs', M.tone)} title={e.title}>
                        <M.icon className="size-2.5 shrink-0" />
                        <span className="truncate">{e.title}</span>
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <p className="px-1.5 text-2xs text-muted-foreground">+{dayEvents.length - 3} lagi</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
