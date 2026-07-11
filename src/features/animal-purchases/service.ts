import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { toast } from '@/stores/toastStore';
import type { PaymentStatus, Species } from '@/types/database';

// --- Types ---

export interface AnimalSaleRow {
  id: string;
  animal_id: string;
  animal_name: string | null;
  animal_species: Species;
  customer_name: string;
  customer_whatsapp: string | null;
  amount: number;
  status: PaymentStatus;
  proof_path: string | null;
  notes: string | null;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejected_reason: string | null;
}

// --- Helpers ---

async function compressToWebp(file: File, maxDim: number, quality: number): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    return blob ?? file;
  } catch {
    return file;
  }
}

async function uploadAnimalPurchaseProof(file: File): Promise<string> {
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
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success(approve ? 'Pembelian disetujui' : 'Pembelian ditolak');
    },
    onError: (e) => toast.fromError(e, 'Gagal memproses'),
  });
}

export function useSubmitAnimalPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      animalId: string;
      amount: number;
      customerId: string;
      proofFile: File;
      notes?: string;
    }) => {
      const proofPath = await uploadAnimalPurchaseProof(input.proofFile);
      const { error } = await supabase.rpc('animal_sale_submit', {
        p_animal_id: input.animalId,
        p_amount: input.amount,
        p_customer_id: input.customerId,
        p_proof: proofPath,
        p_notes: input.notes ?? null,
      });
      if (error) throw toAppError(error);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('Permintaan terkirim', 'Menunggu konfirmasi admin.');
    },
    onError: (e) => toast.fromError(e, 'Gagal mengirim'),
  });
}
