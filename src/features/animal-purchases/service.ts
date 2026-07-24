import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { compressToWebp } from '@/lib/compress';
import { queryKeys } from '@/lib/query/queryKeys';
import { toast } from '@/stores/toastStore';
import type { PaymentStatus, Species } from '@/types/database';

// --- Types ---

export interface AnimalSaleRow {
  id: string;
  animal_id: string;
  animal_name: string | null;
  animal_species: Species;
  customer_name: string | null;
  customer_whatsapp: string | null;
  amount: number;
  status: PaymentStatus;
  proof_path: string | null;
  notes: string | null;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
  rejected_at: string | null;
}

// --- Helpers ---

/** Convert File to base64 string for serverless upload. */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip the "data:image/...;base64," prefix — backend expects raw base64 only
      const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload proof via the serverless endpoint (uses service role key, bypasses storage RLS).
 * Falls back to direct Supabase upload for local dev.
 */
async function uploadAnimalPurchaseProof(file: File): Promise<string> {
  const base64 = await fileToBase64(file);
  const mimeType = file.type || 'image/webp';
  const filename = file.name || 'proof.webp';

  // Try serverless endpoint first (works on Vercel)
  try {
    const res = await fetch('/api/upload-proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, mimeType, base64 }),
    });
    if (res.ok) {
      const { path } = await res.json();
      return path;
    }
    // If endpoint not deployed or error, fall through to direct upload
  } catch {
    // network error — fall through
  }

  // Fallback: direct upload (works for authenticated users with storage RLS)
  const blob = await compressToWebp(file, 1280, 0.85);
  const path = `animal-purchases/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from('qurban-proofs').upload(path, blob, {
    contentType: 'image/webp',
    upsert: false,
  });
  if (error) throw toAppError(error);
  return path;
}

// --- Hooks ---

const KEY = ['animal-purchases'] as const;

/**
 * A sale changes animal status server-side (via the animal_sale_* RPCs), so any
 * mutation must refresh the livestock list/detail and dashboard caches too —
 * otherwise Ternak/Dashboard show stale data until a manual refresh.
 */
function invalidateSaleRelatedQueries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: KEY });
  void qc.invalidateQueries({ queryKey: queryKeys.animals.all });
  void qc.invalidateQueries({ queryKey: ['dashboard'] });
}

export function usePendingAnimalPurchases() {
  return useQuery({
    queryKey: KEY,
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
          customers(full_name, whatsapp),
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
      }));
    },
  });
}

export function useApproveAnimalPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = await supabase.rpc('animal_sale_decide', { p_id: id, p_approve: approve });
      if (error) throw toAppError(error);
    },
    onSuccess: (_, { approve }) => {
      invalidateSaleRelatedQueries(qc);
      toast.success(approve ? 'Pembelian disetujui' : 'Pembelian ditolak');
    },
    onError: (e) => toast.fromError(e, 'Gagal memproses'),
  });
}

export interface BuyerInfo {
  name: string;
  phone: string;
  address: string;
  namaPengurban: string;
}

export function useSubmitAnimalPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      animalId: string;
      amount: number;
      customerId?: string;
      proofFile: File;
      buyer?: BuyerInfo;
    }) => {
      const proofPath = await uploadAnimalPurchaseProof(input.proofFile);
      const notes = input.buyer
        ? `Pembeli: ${input.buyer.name}\nHP: ${input.buyer.phone}\nAlamat: ${input.buyer.address}\nNama Pengurban: ${input.buyer.namaPengurban}`
        : null;
      const { error } = await supabase.rpc('animal_sale_submit', {
        p_animal_id: input.animalId,
        p_amount: input.amount,
        p_customer_id: input.customerId ?? null,
        p_proof: proofPath,
        p_notes: notes,
      });
      if (error) throw toAppError(error);
    },
    onSuccess: () => {
      invalidateSaleRelatedQueries(qc);
      toast.success('Permintaan terkirim', 'Menunggu konfirmasi admin.');
    },
    onError: (e) => toast.fromError(e, 'Gagal mengirim'),
  });
}
