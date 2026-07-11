import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { compressToWebp } from './compress';

export interface UploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Compress, then upload an image to a public Supabase Storage bucket and return
 * its public URL. Used for buyer-facing imagery (animal listings, CMS covers).
 */
export async function uploadPublicImage(
  file: File,
  folder: string,
  bucket = 'public-assets',
): Promise<UploadResult> {
  const blob = await compressToWebp(file, 1280, 0.82);
  const path = `${folder}/${crypto.randomUUID()}.webp`;

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    cacheControl: '3600',
    contentType: 'image/webp',
    upsert: false,
  });
  if (error) throw toAppError(error);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

/**
 * Create a short-lived signed URL for a file in a private bucket so staff can
 * preview sensitive uploads (e.g. legacy qurban transfer proofs). Returns null
 * when the path is empty or doesn't point to an actual stored image.
 */
export async function signedPrivateUrl(
  path: string | null | undefined,
  bucket = 'qurban-proofs',
  expiresIn = 300,
): Promise<string | null> {
  if (!path || !/\.(webp|png|jpe?g)$/i.test(path)) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}
