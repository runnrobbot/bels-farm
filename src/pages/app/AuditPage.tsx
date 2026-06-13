import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { DataTable, type Column } from '@/components/data/DataTable';
import { TablePagination } from '@/components/data/TablePagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { format } from 'date-fns';
import type { AuditLogRow } from '@/types/database';

const PAGE_SIZE = 25;

const ACTION_TONE: Record<string, 'success' | 'info' | 'danger' | 'warning' | 'neutral'> = {
  insert: 'success',
  update: 'info',
  delete: 'danger',
  restore: 'warning',
};

const TABLES = [
  { value: 'all', label: 'Semua tabel' },
  { value: 'animals', label: 'Ternak' },
  { value: 'finance_transactions', label: 'Keuangan' },
  { value: 'customers', label: 'Pelanggan' },
  { value: 'employees', label: 'Karyawan' },
  { value: 'qurban_payments', label: 'Pembayaran qurban' },
  { value: 'user_roles', label: 'Peran pengguna' },
];

export default function AuditPage() {
  const [page, setPage] = useState(0);
  const [table, setTable] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['audit', table, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (table !== 'all') query = query.eq('table_name', table);
      const { data, error, count } = await query;
      if (error) throw toAppError(error);
      return { rows: data ?? [], total: count ?? 0 };
    },
  });

  const columns: Column<AuditLogRow>[] = [
    {
      key: 'action',
      header: 'Aksi',
      render: (r) => <Badge tone={ACTION_TONE[r.action] ?? 'neutral'}>{r.action}</Badge>,
    },
    { key: 'table', header: 'Tabel', render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.table_name}</span> },
    {
      key: 'record',
      header: 'Record',
      render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.record_id?.slice(0, 8) ?? '—'}</span>,
    },
    {
      key: 'time',
      header: 'Waktu',
      align: 'right',
      render: (r) => <span className="text-muted-foreground">{format(new Date(r.created_at), 'd MMM yyyy, HH:mm')}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Log Audit" description="Jejak perubahan penting yang tak terhapus. Hanya-baca." />

      <div className="mb-4 max-w-xs">
        <Select
          value={table}
          onChange={(e) => {
            setTable(e.target.value);
            setPage(0);
          }}
          options={TABLES}
        />
      </div>

      {isLoading ? (
        <div className="panel space-y-3 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.rows ?? []}
            rowKey={(r) => String(r.id)}
            empty={<EmptyState icon={ScrollText} title="Belum ada log" description="Perubahan data akan tercatat di sini." />}
          />
          {data && data.total > 0 && (
            <TablePagination page={page} pageSize={PAGE_SIZE} total={data.total} label="entri" onChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
