import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { toast } from '@/stores/toastStore';
import type { PaymentStatus, Species } from '@/types/database';

/**
 * Upload a transfer proof screenshot to the private qurban-proofs bucket.
 * Returns the storage path (used as proof_path in qurban_payments).
 */
export async function uploadQurbanProof(file: File): Promise<string> {
  const blob = await compressToWebp(file, 1280, 0.85);
  const path = `qurban/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from('qurban-proofs').upload(path, blob, {
    contentType: 'image/webp',
    upsert: false,
  });
  if (error) throw toAppError(error);
  return path;
}

/** Client-side WebP compression helper (mirrors lib/storage.ts pattern). */
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

export interface PortalPayment {
  id: string;
  amount: number;
  status: PaymentStatus;
  paid_at: string;
  method: string | null;
}

export interface PortalEnrollment {
  id: string;
  status: string;
  enrolled_at: string;
  plan: {
    id: string;
    name: string;
    species: Species;
    target_amount: number;
    installment_amount: number | null;
    period_label: string | null;
  };
  paid_confirmed: number;
  paid_pending: number;
  payments: PortalPayment[];
}

export interface PortalOverview {
  customer: { id: string; full_name: string; whatsapp: string | null } | null;
  enrollments: PortalEnrollment[];
}

const KEY = ['portal', 'qurban'] as const;

export function usePortalOverview() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<PortalOverview> => {
      const { data, error } = await supabase.rpc('my_qurban_overview');
      if (error) throw toAppError(error);
      return data as unknown as PortalOverview;
    },
  });
}

export async function ensureMyCustomer(name: string, whatsapp: string): Promise<void> {
  const { error } = await supabase.rpc('ensure_my_customer', { p_name: name, p_whatsapp: whatsapp });
  if (error) throw toAppError(error);
}

export function useEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase.rpc('qurban_enroll', { p_plan: planId });
      if (error) throw toAppError(error);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('Pendaftaran berhasil', 'Anda terdaftar pada paket qurban ini.');
    },
    onError: (e) => toast.fromError(e, 'Gagal mendaftar'),
  });
}

export function useSubmitPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { enrollmentId: string; amount: number; method: string; proofFile?: File }) => {
      const proofPath = input.proofFile ? await uploadQurbanProof(input.proofFile) : '';
      const { error } = await supabase.rpc('qurban_submit_payment', {
        p_enrollment: input.enrollmentId,
        p_amount: input.amount,
        p_method: input.method,
        p_proof: proofPath,
      });
      if (error) throw toAppError(error);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('Setoran terkirim', 'Menunggu konfirmasi admin.');
    },
    onError: (e) => toast.fromError(e, 'Gagal mengirim setoran'),
  });
}
