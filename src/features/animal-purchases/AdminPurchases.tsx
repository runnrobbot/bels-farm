import { useEffect, useState } from 'react';
import { Check, X, Inbox, Eye, ImageOff, MessageCircle } from 'lucide-react';
import { DataTable, type Column } from '@/components/data/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ActivityTimeline } from '@/components/data/ActivityTimeline';
import { useAnimalTimeline } from '@/features/livestock/hooks/useAnimals';
import { STATUS_LABEL, STATUS_TONE } from '@/features/livestock/labels';
import { toast } from '@/stores/toastStore';
import { formatCurrency, whatsappLink } from '@/lib/utils';
import { format } from 'date-fns';
import { SPECIES_ID } from '@/features/marketing/species';
import { usePendingAnimalPurchases, useApproveAnimalPurchase, type AnimalSaleRow } from './service';

export function AdminPurchases() {
  const [preview, setPreview] = useState<AnimalSaleRow | null>(null);
  const { data = [], isLoading } = usePendingAnimalPurchases();
  const approveMutation = useApproveAnimalPurchase();

  const decide = async (id: string, approve: boolean) => {
    try {
      await approveMutation.mutateAsync({ id, approve });
      setPreview(null);
    } catch {
      toast.fromError(new Error('Gagal memproses'), 'Gagal memproses');
    }
  };

  const columns: Column<AnimalSaleRow>[] = [
    {
      key: 'animal',
      header: 'Hewan',
      render: (p) => (
        <span className="font-medium text-foreground">
          {p.animal_name ?? p.animal_id.slice(0, 8)} <span className="text-muted-foreground">({SPECIES_ID[p.animal_species]})</span>
        </span>
      ),
    },
    {
      key: 'animal_status',
      header: 'Status hewan',
      render: (p) =>
        p.animal_status ? (
          <Badge tone={STATUS_TONE[p.animal_status]} dot>
            {STATUS_LABEL[p.animal_status]}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    { key: 'customer', header: 'Pelanggan', render: (p) => <span className="font-medium text-foreground">{p.customer_name}</span> },
    { key: 'amount', header: 'Nominal', align: 'right', render: (p) => <span className="font-semibold tabular-nums">{formatCurrency(p.amount)}</span> },
    { key: 'date', header: 'Tanggal', render: (p) => <span className="text-muted-foreground">{format(new Date(p.created_at), 'd MMM yyyy')}</span> },
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
        empty={<EmptyState icon={Inbox} title="Tidak ada pembelian menunggu" description="Semua permintaan sudah diproses." />}
      />

      {preview && (
        <PreviewModal
          sale={preview}
          deciding={approveMutation.isPending}
          onClose={() => setPreview(null)}
          onDecide={(approve) => void decide(preview.id, approve)}
        />
      )}
    </>
  );
}

function PreviewModal({
  sale,
  deciding,
  onClose,
  onDecide,
}: {
  sale: AnimalSaleRow;
  deciding: boolean;
  onClose: () => void;
  onDecide: (approve: boolean) => void;
}) {
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState(true);
  // Riwayat status/aktivitas hewan — supaya admin bisa melihat apakah hewan ini
  // pernah diajukan/diproses sebelumnya sebelum menyetujui pembelian.
  const { data: history = [], isLoading: loadingHistory } = useAnimalTimeline(sale.animal_id);

  useEffect(() => {
    let active = true;
    setLoadingProof(true);
    const path = sale.proof_path;
    if (!path) {
      setProofUrl(null);
      setLoadingProof(false);
      return;
    }
    void import('@/lib/supabase/client').then(({ supabase }) =>
      supabase.storage.from('qurban-proofs').createSignedUrl(path, 300).then(({ data, error }) => {
        if (active) {
          setProofUrl(error ? null : data?.signedUrl ?? null);
          setLoadingProof(false);
        }
      }),
    );
    return () => { active = false; };
  }, [sale.proof_path]);

  const rows = [
    { label: 'Hewan', value: `${sale.animal_name ?? sale.animal_id} (${SPECIES_ID[sale.animal_species]})` },
    { label: 'Pelanggan', value: sale.customer_name },
    { label: 'Nominal', value: formatCurrency(sale.amount) },
    { label: 'Tanggal', value: format(new Date(sale.created_at), 'd MMMM yyyy, HH:mm') },
    ...(sale.notes ? [{ label: 'Catatan', value: sale.notes }] : []),
  ];

  // Pengajuan yang sehat selalu mengunci hewan jadi 'reserved'. Kalau bukan,
  // ada yang tidak wajar (mis. hewan sudah terjual di jalur lain) — beri tanda
  // sebelum admin menekan Setujui.
  const statusMismatch = Boolean(sale.animal_status) && sale.animal_status !== 'reserved';

  return (
    <Modal
      open
      onClose={onClose}
      title="Tinjau pembelian hewan"
      description="Periksa detail, riwayat hewan, dan bukti transfer sebelum mengambil keputusan."
      size="md"
      footer={
        <>
          {sale.customer_whatsapp && (
            <a
              href={whatsappLink(sale.customer_whatsapp, `Halo ${sale.customer_name}, terkait pembelian hewan...`)}
              target="_blank"
              rel="noreferrer"
              className="mr-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-green-700 hover:bg-green-50"
            >
              <MessageCircle className="size-4" /> Hubungi via WA
            </a>
          )}
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
          {sale.animal_status && (
            <div className="flex items-center justify-between px-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">Status hewan</dt>
              <dd>
                <Badge tone={STATUS_TONE[sale.animal_status]} dot>
                  {STATUS_LABEL[sale.animal_status]}
                </Badge>
              </dd>
            </div>
          )}
        </dl>

        {statusMismatch && (
          <div className="rounded-lg border border-border bg-surface-sunken px-3 py-2.5 text-xs text-muted-foreground">
            Hewan ini berstatus <span className="font-medium text-foreground">{STATUS_LABEL[sale.animal_status]}</span>, bukan
            {' '}<span className="font-medium text-foreground">Dipesan</span>. Pengajuan yang normal selalu mengunci hewan jadi
            Dipesan — periksa riwayat di bawah dulu sebelum menyetujui.
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Riwayat hewan</p>
          {loadingHistory ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border p-3">
              <ActivityTimeline events={history} />
            </div>
          )}
        </div>

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
              <p>Tidak ada bukti foto.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
