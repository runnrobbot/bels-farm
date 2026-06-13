/**
 * Vercel serverless function: create a Midtrans Snap transaction token.
 *
 * Flow:
 *  1. Verify the caller's Supabase session and that they own the enrollment.
 *  2. Record a PENDING qurban payment (service role) referencing a fresh order_id.
 *  3. Ask Midtrans Snap for a token using the secret server key.
 *
 * Env required (set in Vercel project settings, NOT prefixed with VITE_):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MIDTRANS_SERVER_KEY,
 *   MIDTRANS_IS_PRODUCTION ("true" | "false")
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? '';
const IS_PROD = process.env.MIDTRANS_IS_PRODUCTION === 'true';
const SNAP_URL = IS_PROD
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!SUPABASE_URL || !SERVICE_ROLE || !SERVER_KEY) {
    res.status(500).json({ error: 'Server not configured for payments' });
    return;
  }

  try {
    const auth = (req.headers.authorization as string | undefined) ?? '';
    const accessToken = auth.replace(/^Bearer\s+/i, '');
    if (!accessToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    const { data: userData, error: userErr } = await admin.auth.getUser(accessToken);
    if (userErr || !userData.user) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }
    const uid = userData.user.id;

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const enrollmentId: string = body.enrollmentId;
    const amount = Math.round(Number(body.amount));
    if (!enrollmentId || !Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: 'Invalid request' });
      return;
    }

    // Ownership check: the enrollment must belong to this user's customer record.
    const { data: enr, error: enrErr } = await admin
      .from('qurban_enrollments')
      .select('id, customers!inner(profile_id, full_name)')
      .eq('id', enrollmentId)
      .single();
    if (enrErr || !enr || (enr as any).customers?.profile_id !== uid) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const orderId = `QRB-${Date.now()}-${enrollmentId.slice(0, 8)}`;

    // Record the pending payment first so it's tracked even before the webhook.
    const { error: payErr } = await admin.from('qurban_payments').insert({
      enrollment_id: enrollmentId,
      amount,
      status: 'pending',
      method: 'Midtrans',
      proof_path: orderId,
    });
    if (payErr) {
      res.status(500).json({ error: 'Failed to record payment' });
      return;
    }

    const customerName = (enr as any).customers?.full_name ?? body.customerName ?? 'Pelanggan';
    const snapRes = await fetch(SNAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${Buffer.from(`${SERVER_KEY}:`).toString('base64')}`,
      },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: amount },
        customer_details: { first_name: customerName, email: body.email || undefined },
        item_details: [{ id: enrollmentId, price: amount, quantity: 1, name: 'Tabungan Qurban' }],
        credit_card: { secure: true },
      }),
    });

    if (!snapRes.ok) {
      const text = await snapRes.text();
      res.status(502).json({ error: `Midtrans error: ${text}` });
      return;
    }
    const snap = (await snapRes.json()) as { token: string; redirect_url: string };
    res.status(200).json({ token: snap.token, orderId });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
