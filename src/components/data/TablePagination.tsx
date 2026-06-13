import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  label?: string;
  onChange: (page: number) => void;
}

/** Shared "showing X of N" + prev/next pager used across admin list pages. */
export function TablePagination({ page, pageSize, total, label = 'data', onChange }: TablePaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {total.toLocaleString('id-ID')} {label}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>
            <ChevronLeft className="size-4" /> Sebelumnya
          </Button>
          <span className="tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => onChange(page + 1)}
          >
            Berikutnya <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
