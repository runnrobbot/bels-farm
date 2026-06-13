import { useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Plus,
  Syringe,
  Scale,
  Stethoscope,
  ArrowRightLeft,
  Tag,
  Circle,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityEventRow } from '@/types/database';
import { staggerIn } from '@/lib/animation/motion';
import { cn } from '@/lib/utils';

const VERB_ICON: Record<string, LucideIcon> = {
  created: Plus,
  vaccinated: Syringe,
  weight_updated: Scale,
  treatment: Stethoscope,
  disease: Stethoscope,
  ownership_transferred: ArrowRightLeft,
  sold: Tag,
};

const VERB_TONE: Record<string, string> = {
  created: 'bg-primary/12 text-primary',
  vaccinated: 'bg-info/12 text-info',
  weight_updated: 'bg-success/12 text-success',
  sold: 'bg-accent/12 text-accent',
};

/** GitHub-style vertical activity feed for any entity. */
export function ActivityTimeline({ events }: { events: ActivityEventRow[] }) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (ref.current) staggerIn(ref.current.querySelectorAll('[data-event]'), { delay: 40, y: 10 });
  }, [events]);

  if (events.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No activity recorded yet.</p>;
  }

  return (
    <ol ref={ref} className="relative space-y-1">
      <span className="absolute bottom-2 left-[15px] top-2 w-px bg-border" aria-hidden />
      {events.map((event) => {
        const Icon = VERB_ICON[event.verb] ?? Circle;
        return (
          <li key={event.id} data-event className="relative flex gap-3 pb-4">
            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background',
                VERB_TONE[event.verb] ?? 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-sm text-foreground">{event.summary}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
