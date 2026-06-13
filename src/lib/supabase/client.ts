import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import type { Database } from '@/types/database';

/**
 * Single shared Supabase client, typed against the generated Database schema.
 *
 * A module-level singleton avoids creating multiple GoTrue instances (which race
 * on token refresh) and keeps the realtime socket connection pooled.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'bels-auth',
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
  global: {
    headers: { 'x-client-info': 'bels-farm-web' },
  },
});

export type SupabaseClient = typeof supabase;
