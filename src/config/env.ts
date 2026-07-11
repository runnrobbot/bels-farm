import { z } from 'zod';

/**
 * Validates and exposes runtime environment configuration.
 *
 * Fails fast with a readable message during development if required Supabase
 * credentials are missing, instead of surfacing a cryptic runtime error deep in
 * the auth flow.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(20, 'VITE_SUPABASE_ANON_KEY looks invalid'),
  VITE_WHATSAPP_NUMBER: z
    .string()
    .regex(/^\d{8,15}$/, 'VITE_WHATSAPP_NUMBER must be digits only (international format)')
    .optional(),
  VITE_SITE_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(
    `[BELS FARM] Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and fill in your Supabase credentials.`,
  );
  throw new Error('Invalid environment configuration. See console for details.');
}

export const env = {
  supabaseUrl: parsed.data.VITE_SUPABASE_URL,
  supabaseAnonKey: parsed.data.VITE_SUPABASE_ANON_KEY,
  whatsappNumber: parsed.data.VITE_WHATSAPP_NUMBER ?? '',
  siteUrl: parsed.data.VITE_SITE_URL ?? window.location.origin,
} as const;
