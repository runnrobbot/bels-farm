import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X, Inbox, Eye, ImageOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { DataTable, type Column } from '@/components/data/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { signedPrivateUrl } from '@/lib/storage';
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
  const [preview, setPreview] = useState<PendingPayment | null>(null);
  const [deciding, setDeciding] = useState(false);

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
    setDeciding(true);
    try {
      const { error } = await supabase.rpc('qurban_confirm_payment', { p_id: id, p_approve: approve });
      if (error) throw toAppError(error);
      await qc.invalidateQueries({ queryKey: ['qurban', 'pending-payments'] });
      await qc.invalidateQueries({ queryKey: ['qurban', 'participants'] });
      toast.success(approve ? 'Setoran dikonfirmasi' : 'Setoran ditolak');
      setPreview(null);
    } catch (error) {
      toast.fromError(error, 'Gagal memproses');
    } finally {
      setDeciding(false);
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
        <Button size="sm" variant="outline" onClick={() => setPreview(p)}>
          <Eye className="size-4" /> Tinjau
        </Button>
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
    <>
      <DataTable
        columns={columns}
        rows={data}
        rowKey={(p) => p.id}
        empty={<EmptyState icon={Inbox} title="Tidak ada setoran menunggu" description="Semua setoran sudah diproses." />}
      />

      {preview && (
        <PreviewModal
          payment={preview}
          deciding={deciding}
          onClose={() => setPreview(null)}
          onDecide={(approve) => void decide(preview.id, approve)}
        />
      )}
    </>
  );
}

function PreviewModal({
  payment,
  deciding,
  onClose,
  onDecide,
}: {
  payment: PendingPayment;
  deciding: boolean;
  onClose: () => void;
  onDecide: (approve: boolean) => void;
}) {
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingProof(true);
    void signedPrivateUrl(payment.proof_path).then((url) => {
      if (active) {
        setProofUrl(url);
        setLoadingProof(false);
      }
    });
    return () => {
      active = false;
    };
  }, [payment.proof_path]);

  const rows = [
    { label: 'Pelanggan', value: payment.customer_name },
    { label: 'Paket', value: payment.plan_name },
    { label: 'Nominal', value: formatCurrency(payment.amount) },
    { label: 'Metode', value: payment.method ?? '—' },
    { label: 'Tanggal', value: format(new Date(payment.paid_at), 'd MMMM yyyy, HH:mm') },
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title="Tinjau setoran"
      description="Periksa detail setoran sebelum mengambil keputusan."
      size="md"
      footer={
        <>
          <Button variant="outline" loading={deciding} onClick={() => onDecide(false)}>
            <X className="size-4" /> Tolak
          </Button>
          <Button variant="primary" loading={deciding} onClick={() => onDecide(true)}>
            <Check className="size-4" /> Setujui
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <dl className="divide-y divide-border rounded-lg border border-border">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="font-medium text-foreground">{r.value}</dd>
            </div>
          ))}
        </dl>

        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            Bukti transfer
            <Badge tone="neutral">{proofUrl ? 'Terlampir' : 'Tidak ada'}</Badge>
          </p>
          {loadingProof ? (
            <Skeleton className="h-48 w-full" />
          ) : proofUrl ? (
            <a href={proofUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border">
              <img src={proofUrl} alt="Bukti transfer" className="max-h-64 w-full object-contain bg-surface-sunken" />
            </a>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-surface-sunken py-8 text-center text-sm text-muted-foreground">
              <ImageOff className="size-6" />
              <p>Tidak ada bukti foto. Konfirmasi berdasarkan catatan transfer / pembayaran online.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
