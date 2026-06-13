import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X, Inbox } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { DataTable, type Column } from '@/components/data/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { toast } from '@/stores/toastStore';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface PendingPayment {
  id: string;
  amount: number;
  paid_at: string;
  method: string | null;
  proof_path: string | null;
  customer_name: string;
  plan_name: string;
}

export function QurbanApprovals() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['qurban', 'pending-payments'],
    queryFn: async (): Promise<PendingPayment[]> => {
      const { data, error } = await supabase.rpc('qurban_pending_payments');
      if (error) throw toAppError(error);
      return (data ?? []) as unknown as PendingPayment[];
    },
    refetchInterval: 30_000,
  });

  const decide = async (id: string, approve: boolean) => {
    try {
      const { error } = await supabase.rpc('qurban_confirm_payment', { p_id: id, p_approve: approve });
      if (error) throw toAppError(error);
      await qc.invalidateQueries({ queryKey: ['qurban', 'pending-payments'] });
      toast.success(approve ? 'Setoran dikonfirmasi' : 'Setoran ditolak');
    } catch (error) {
      toast.fromError(error, 'Gagal memproses');
    }
  };

  const columns: Column<PendingPayment>[] = [
    { key: 'customer', header: 'Pelanggan', render: (p) => <span className="font-medium text-foreground">{p.customer_name}</span> },
    { key: 'plan', header: 'Paket', render: (p) => <span className="text-muted-foreground">{p.plan_name}</span> },
    { key: 'amount', header: 'Nominal', align: 'right', render: (p) => <span className="font-semibold tabular-nums">{formatCurrency(p.amount)}</span> },
    { key: 'date', header: 'Tanggal', render: (p) => <span className="text-muted-foreground">{format(new Date(p.paid_at), 'd MMM yyyy')}</span> },
    { key: 'method', header: 'Metode', render: (p) => p.method ?? '—' },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="primary" onClick={() => void decide(p.id, true)}>
            <Check className="size-4" /> Setujui
          </Button>
          <Button size="sm" variant="outline" onClick={() => void decide(p.id, false)}>
            <X className="size-4" /> Tolak
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="panel space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      rows={data}
      rowKey={(p) => p.id}
      empty={<EmptyState icon={Inbox} title="Tidak ada setoran menunggu" description="Semua setoran sudah diproses." />}
    />
  );
}
