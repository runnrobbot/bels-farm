import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X, Inbox, Eye, ImageOff, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { DataTable, type Column } from '@/components/data/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/stores/toastStore';
import { formatCurrency } from '@/lib/utils';
import { whatsappLink } from '@/lib/utils';
import { format } from 'date-fns';
import { SPECIES_ID } from '@/features/marketing/species';
import type { AnimalSaleRow } from './service';

export function AdminPurchases() {
  const qc = useQueryClient();
  const [preview, setPreview] = useState<AnimalSaleRow | null>(null);
  const [deciding, setDeciding] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ['animal-purchases'],
    queryFn: async (): Promise<AnimalSaleRow[]> => {
      const { data, error } = await supabase
        .from('animal_sales')
        .select(`
          id,
          animal_id,
          amount,
          status,
          proof_path,
          notes,
          created_at,
          approved_by,
          approved_at,
          rejected_at,
          rejected_reason,
          customers!inner(full_name, whatsapp),
          animals!inner(name, species)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw toAppError(error);
      return (data ?? []).map((r: any) => ({
        id: r.id,
        animal_id: r.animal_id,
        animal_name: r.animals?.name ?? null,
        animal_species: r.animals?.species,
        customer_name: r.customers?.full_name,
        customer_whatsapp: r.customers?.whatsapp,
        amount: r.amount,
        status: r.status,
        proof_path: r.proof_path,
        notes: r.notes,
        created_at: r.created_at,
        approved_by: r.approved_by,
        approved_at: r.approved_at,
        rejected_at: r.rejected_at,
        rejected_reason: r.rejected_reason,
      }));
    },
    refetchInterval: 30_000,
  });

  const decide = async (id: string, approve: boolean) => {
    setDeciding(true);
    try {
      const { error } = await supabase.rpc('animal_sale_decide', { p_id: id, p_approve: approve });
      if (error) throw toAppError(error);
      await qc.invalidateQueries({ queryKey: ['animal-purchases'] });
      toast.success(approve ? 'Pembelian disetujui' : 'Pembelian ditolak');
      setPreview(null);
    } catch (error) {
      toast.fromError(error, 'Gagal memproses');
    } finally {
      setDeciding(false);
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
          deciding={deciding}
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

  useEffect(() => {
    let active = true;
    setLoadingProof(true);
    if (!sale.proof_path) {
      setProofUrl(null);
      setLoadingProof(false);
      return;
    }
    void supabase.storage.from('qurban-proofs').createSignedUrl(sale.proof_path, 300).then(({ data, error }) => {
      if (active) {
        setProofUrl(error ? null : data?.signedUrl ?? null);
        setLoadingProof(false);
      }
    });
    return () => {
      active = false;
    };
  }, [sale.proof_path]);

  const rows = [
    { label: 'Hewan', value: `${sale.animal_name ?? sale.animal_id} (${SPECIES_ID[sale.animal_species]})` },
    { label: 'Pelanggan', value: sale.customer_name },
    { label: 'Nominal', value: formatCurrency(sale.amount) },
    { label: 'Tanggal', value: format(new Date(sale.created_at), 'd MMMM yyyy, HH:mm') },
    ...(sale.notes ? [{ label: 'Catatan', value: sale.notes }] : []),
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title="Tinjau pembelian hewan"
      description="Periksa detail dan bukti transfer sebelum mengambil keputusan."
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
              <p>Tidak ada bukti foto.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
