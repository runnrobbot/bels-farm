/**
 * Vercel serverless function: Midtrans payment notification (webhook).
 *
 * Set this URL as the Payment Notification URL in your Midtrans dashboard:
 *   https://<your-domain>/api/midtrans-notification
 *
 * Verifies the signature, then reconciles the matching qurban payment
 * (referenced by order_id stored in proof_path) to confirmed/rejected.
 */
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? '';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const orderId: string = body.order_id;
    const statusCode: string = body.status_code;
    const grossAmount: string = body.gross_amount;
    const signature: string = body.signature_key;
    const txStatus: string = body.transaction_status;
    const fraud: string = body.fraud_status;

    // Verify Midtrans signature: sha512(order_id + status_code + gross_amount + server_key).
    const expected = createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${SERVER_KEY}`)
      .digest('hex');
    if (expected !== signature) {
      res.status(403).json({ error: 'Invalid signature' });
      return;
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    let newStatus: 'confirmed' | 'rejected' | 'pending' = 'pending';
    if ((txStatus === 'capture' && fraud === 'accept') || txStatus === 'settlement') {
      newStatus = 'confirmed';
    } else if (['cancel', 'deny', 'expire', 'failure'].includes(txStatus)) {
      newStatus = 'rejected';
    }

    if (newStatus !== 'pending') {
      await admin
        .from('qurban_payments')
        .update({
          status: newStatus,
          approved_at: newStatus === 'confirmed' ? new Date().toISOString() : null,
        })
        .eq('proof_path', orderId);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
