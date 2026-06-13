import { useMemo } from 'react';
import type { WeightRecordRow } from '@/types/database';
import { formatWeight } from '@/lib/utils';

/**
 * Lightweight dependency-free weight trend chart (SVG line + area). Avoids
 * pulling in a charting library for what is a simple, performant sparkline.
 */
export function WeightChart({ records }: { records: WeightRecordRow[] }) {
  const geometry = useMemo(() => {
    if (records.length < 2) return null;
    const w = 600;
    const h = 180;
    const pad = 8;
    const values = records.map((r) => Number(r.weight_kg));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;

    const points = records.map((r, i) => {
      const x = pad + (i / (records.length - 1)) * (w - pad * 2);
      const y = h - pad - ((Number(r.weight_kg) - min) / span) * (h - pad * 2);
      return [x, y] as const;
    });

    const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = `${line} L${points[points.length - 1][0].toFixed(1)},${h - pad} L${points[0][0].toFixed(1)},${h - pad} Z`;
    return { w, h, line, area, points, min, max };
  }, [records]);

  if (!geometry) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        At least two weight records are needed to chart a trend.
      </p>
    );
  }

  const { w, h, line, area, points } = geometry;
  const first = Number(records[0].weight_kg);
  const last = Number(records[records.length - 1].weight_kg);
  const gain = last - first;

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <span className="font-display text-2xl font-semibold tabular-nums text-foreground">
          {formatWeight(last)}
        </span>
        <span className={`text-sm font-medium ${gain >= 0 ? 'text-success' : 'text-danger'}`}>
          {gain >= 0 ? '+' : ''}
          {formatWeight(gain)} overall
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full" preserveAspectRatio="none" role="img" aria-label="Weight trend">
        <defs>
          <linearGradient id="weight-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#weight-fill)" />
        <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill="hsl(var(--primary))" />
        ))}
      </svg>
    </div>
  );
}
