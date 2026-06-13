import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { cn, formatCompact, formatCurrency } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  format?: 'number' | 'currency' | 'compact';
  tone?: 'primary' | 'success' | 'danger' | 'info' | 'accent';
  delta?: number;
}

const TONES = {
  primary: 'text-primary bg-primary/10',
  success: 'text-success bg-success/10',
  danger: 'text-danger bg-danger/10',
  info: 'text-info bg-info/10',
  accent: 'text-accent bg-accent/10',
} as const;

export function StatCard({ label, value, icon: Icon, format = 'number', tone = 'primary', delta }: StatCardProps) {
  const animated = useCountUp(value);
  const display =
    format === 'currency'
      ? formatCurrency(animated)
      : format === 'compact'
        ? formatCompact(animated)
        : new Intl.NumberFormat('id-ID').format(animated);

  return (
    <div className="panel group relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {display}
          </p>
        </div>
        <span className={cn('flex size-10 items-center justify-center rounded-xl', TONES[tone])}>
          <Icon className="size-5" />
        </span>
      </div>
      {delta !== undefined && (
        <p
          className={cn(
            'mt-3 text-xs font-medium',
            delta >= 0 ? 'text-success' : 'text-danger',
          )}
        >
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% vs last month
        </p>
      )}
    </div>
  );
}
