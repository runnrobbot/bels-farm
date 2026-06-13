import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { AnimalWithBreed } from '../services/livestockService';
import { SPECIES_LABEL, SPECIES_TONE, STATUS_LABEL, STATUS_TONE } from '../labels';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { paths } from '@/app/routes/paths';
import { formatWeight } from '@/lib/utils';

const ROW_HEIGHT = 60;

/**
 * Virtualized animal table. Only the rows in view are rendered, so the list
 * stays smooth at thousands of records. The header is a sibling (not virtualized)
 * to keep column alignment crisp.
 */
export function AnimalTable({ rows }: { rows: AnimalWithBreed[] }) {
  const navigate = useNavigate();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  return (
    <div className="panel overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 border-b border-border bg-surface-sunken px-4 py-2.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Animal</span>
        <span>Species</span>
        <span>Breed</span>
        <span>Weight</span>
        <span>Status</span>
        <span className="w-5" />
      </div>

      <div ref={parentRef} className="max-h-[calc(100dvh-320px)] overflow-auto">
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const animal = rows[virtualRow.index];
            return (
              <button
                key={animal.id}
                onClick={() => navigate(paths.animal(animal.id))}
                className="absolute left-0 top-0 grid w-full grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-3 border-b border-border px-4 text-left text-sm transition-colors hover:bg-muted/60"
                style={{ height: ROW_HEIGHT, transform: `translateY(${virtualRow.start}px)` }}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar name={animal.name || animal.ear_tag} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">
                      {animal.name || 'Unnamed'}
                    </span>
                    <span className="block truncate font-mono text-2xs text-muted-foreground">
                      {animal.ear_tag}
                    </span>
                  </span>
                </span>
                <span>
                  <Badge tone={SPECIES_TONE[animal.species]}>{SPECIES_LABEL[animal.species]}</Badge>
                </span>
                <span className="truncate text-muted-foreground">{animal.breed?.name ?? '—'}</span>
                <span className="tabular-nums text-foreground">
                  {formatWeight(animal.current_weight_kg)}
                </span>
                <span>
                  <Badge tone={STATUS_TONE[animal.status]} dot>
                    {STATUS_LABEL[animal.status]}
                  </Badge>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
