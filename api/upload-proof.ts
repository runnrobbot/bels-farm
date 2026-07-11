/**
 * Vercel serverless function: upload transfer proof screenshot.
 *
 * Accepts a base64-encoded image, compresses to WebP, and stores in the
 * private qurban-proofs bucket. Returns the storage path.
 *
 * Env required (set in Vercel project settings):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    res.status(500).json({ error: 'Server not configured' });
    return;
  }

  try {
    const { filename, mimeType, base64 } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!filename || !base64) {
      res.status(400).json({ error: 'Missing filename or base64 data' });
      return;
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const path = `animal-purchases/${Date.now()}-${crypto.randomUUID()}.webp`;
    const buffer = Buffer.from(base64, 'base64');

    const { error: uploadError } = await admin.storage
      .from('qurban-proofs')
      .upload(path, buffer, {
        contentType: mimeType || 'image/webp',
        upsert: false,
      });

    if (uploadError) {
      res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
      return;
    }

    res.status(200).json({ path });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
