import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface Column<R> {
  key: string;
  header: ReactNode;
  render: (row: R) => ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<R> {
  columns: Column<R>[];
  rows: R[];
  rowKey: (row: R) => string;
  onRowClick?: (row: R) => void;
  empty?: ReactNode;
}

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

/**
 * Compact, accessible table for admin lists. Deliberately not virtualized —
 * admin pages are paginated server-side, so the DOM stays small. For very large
 * datasets (e.g. livestock) the virtualized AnimalTable is used instead.
 */
export function DataTable<R>({ columns, rows, rowKey, onRowClick, empty }: DataTableProps<R>) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-sunken">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-2xs font-semibold uppercase tracking-wide text-muted-foreground',
                    ALIGN[col.align ?? 'left'],
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-border/60 transition-colors last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-muted/50',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3 text-foreground', ALIGN[col.align ?? 'left'], col.className)}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
