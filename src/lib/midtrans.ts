import { supabase } from '@/lib/supabase/client';
import { env } from '@/config/env';
import { AppError } from '@/lib/errors';

interface SnapResult {
  order_id?: string;
  transaction_status?: string;
}

interface SnapCallbacks {
  onSuccess?: (result: SnapResult) => void;
  onPending?: (result: SnapResult) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
}

interface Snap {
  pay: (token: string, callbacks: SnapCallbacks) => void;
}

declare global {
  interface Window {
    snap?: Snap;
  }
}

const SNAP_SRC = env.midtransProduction
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js';

let scriptPromise: Promise<void> | null = null;

/** Lazily inject Midtrans Snap.js (once) with the public client key. */
function loadSnap(): Promise<void> {
  if (window.snap) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SNAP_SRC;
    script.setAttribute('data-client-key', env.midtransClientKey);
    script.onload = () => resolve();
    script.onerror = () => reject(new AppError('network', 'Gagal memuat Midtrans.'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export type PaymentOutcome = 'success' | 'pending' | 'closed' | 'error';

/**
 * Open the Midtrans Snap popup for a qurban installment. Requests a transaction
 * token from our serverless endpoint (which records a pending payment and talks
 * to Midtrans with the secret server key), then resolves with the outcome.
 */
export async function payWithMidtrans(input: {
  enrollmentId: string;
  amount: number;
  customerName?: string;
  email?: string;
}): Promise<PaymentOutcome> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new AppError('unauthorized', 'Sesi berakhir, silakan masuk lagi.');

  const res = await fetch('/api/midtrans-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new AppError('unknown', msg || 'Gagal memulai pembayaran.');
  }
  const { token } = (await res.json()) as { token: string };

  await loadSnap();
  if (!window.snap) throw new AppError('network', 'Midtrans belum siap.');

  return new Promise<PaymentOutcome>((resolve) => {
    window.snap!.pay(token, {
      onSuccess: () => resolve('success'),
      onPending: () => resolve('pending'),
      onError: () => resolve('error'),
      onClose: () => resolve('closed'),
    });
  });
}
