import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';

/**
 * Downscale + convert an image to WebP on the client before upload. Keeps stored
 * assets small (faster public site, lower bandwidth) without a server step.
 * Falls back to the original file if the browser can't encode WebP.
 */
async function compressToWebp(file: File, maxDimension = 1280, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

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
  const blob = await compressToWebp(file);
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
 * Upload an image to a private bucket and return only its storage path (no
 * public URL). Used for sensitive files like qurban transfer proofs, which
 * staff view through signed URLs.
 */
export async function uploadPrivateImage(
  file: File,
  folder: string,
  bucket = 'qurban-proofs',
): Promise<string> {
  const blob = await compressToWebp(file);
  const path = `${folder}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    cacheControl: '3600',
    contentType: 'image/webp',
    upsert: false,
  });
  if (error) throw toAppError(error);
  return path;
}
