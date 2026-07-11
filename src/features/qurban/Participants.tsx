import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { DataTable, type Column } from '@/components/data/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { SPECIES_ID } from '@/features/marketing/species';
import type { Species } from '@/types/database';

interface Participant {
  enrollment_id: string;
  customer_name: string;
  customer_contact: string | null;
  plan_name: string;
  species: Species;
  target_amount: number;
  status: string;
  enrolled_at: string;
  paid_confirmed: number;
  paid_pending: number;
}

export function QurbanParticipants() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['qurban', 'participants'],
    queryFn: async (): Promise<Participant[]> => {
      const { data, error } = await supabase.rpc('qurban_enrollment_summary');
      if (error) throw toAppError(error);
      return (data ?? []) as unknown as Participant[];
    },
    refetchInterval: 60_000,
  });

  const totals = useMemo(() => {
    const confirmed = data.reduce((s, p) => s + Number(p.paid_confirmed), 0);
    const pending = data.reduce((s, p) => s + Number(p.paid_pending), 0);
    return { count: data.length, confirmed, pending };
  }, [data]);

  const columns: Column<Participant>[] = [
    {
      key: 'customer',
      header: 'Peserta',
      render: (p) => (
        <div>
          <p className="font-medium text-foreground">{p.customer_name}</p>
          {p.customer_contact && <p className="text-xs text-muted-foreground">{p.customer_contact}</p>}
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Paket',
      render: (p) => (
        <div>
          <p className="text-foreground">{p.plan_name}</p>
          <p className="text-xs text-muted-foreground">{SPECIES_ID[p.species]}</p>
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progres',
      render: (p) => {
        const pct = Math.min(100, Math.round((Number(p.paid_confirmed) / Number(p.target_amount)) * 100));
        return (
          <div className="min-w-36">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-foreground">{formatCurrency(p.paid_confirmed)}</span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-2xs text-muted-foreground">dari {formatCurrency(p.target_amount)}</p>
          </div>
        );
      },
    },
    {
      key: 'pending',
      header: 'Menunggu',
      align: 'right',
      render: (p) =>
        Number(p.paid_pending) > 0 ? (
          <Badge tone="warning">{formatCurrency(p.paid_pending)}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'enrolled',
      header: 'Daftar',
      align: 'right',
      render: (p) => <span className="text-muted-foreground">{format(new Date(p.enrolled_at), 'd MMM yyyy')}</span>,
    },
  ];

  if (isLoading) {
    return (
      <div className="panel space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={Users}
        title="Gagal memuat peserta"
        description="Tidak dapat mengambil data peserta. Pastikan migrasi database terbaru (0023) sudah diterapkan, lalu muat ulang halaman."
      />
    );
  }

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-muted-foreground">Total peserta</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-foreground">{totals.count}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Terkumpul (terkonfirmasi)</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-success">{formatCurrency(totals.confirmed)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Menunggu konfirmasi</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-warning">{formatCurrency(totals.pending)}</p>
        </Card>
      </div>

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(p) => p.enrollment_id}
        empty={<EmptyState icon={Users} title="Belum ada peserta" description="Peserta tabungan qurban akan muncul di sini." />}
      />
    </div>
  );
}
