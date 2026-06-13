import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X, Star } from 'lucide-react';
import { uploadPublicImage } from '@/lib/storage';
import { toast } from '@/stores/toastStore';
import { cn } from '@/lib/utils';

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder: string;
  max?: number;
}

/**
 * Upload up to `max` images (WebP, to a public bucket). The first image is the
 * cover. Supports remove and "set as cover" (reorder to front).
 */
export function MultiImageUpload({ value, onChange, folder, max = 5 }: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const remaining = max - value.length;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = Array.from(files).slice(0, remaining);
    if (picked.length < files.length) {
      toast.warning('Sebagian dilewati', `Maksimal ${max} foto.`);
    }
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of picked) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error('Gambar terlalu besar', `"${file.name}" melebihi 10 MB.`);
          continue;
        }
        const { publicUrl } = await uploadPublicImage(file, folder);
        uploaded.push(publicUrl);
      }
      if (uploaded.length) onChange([...value, ...uploaded]);
    } catch (error) {
      toast.fromError(error, 'Gagal mengunggah gambar');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (url: string) => onChange(value.filter((u) => u !== url));
  const makeCover = (url: string) => onChange([url, ...value.filter((u) => u !== url)]);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <div key={url} className="group relative size-24 overflow-hidden rounded-lg border border-border">
            <img src={url} alt={`Foto ${i + 1}`} className="size-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                <Star className="size-2.5" fill="currentColor" strokeWidth={0} /> Sampul
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => makeCover(url)}
                  className="rounded-md bg-white/90 px-1.5 py-1 text-[10px] font-medium text-black"
                >
                  Jadikan sampul
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(url)}
                className="flex size-6 items-center justify-center rounded-full bg-white/90 text-danger"
                aria-label="Hapus"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'flex size-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-input text-muted-foreground transition-colors hover:border-ring hover:text-foreground',
            )}
          >
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            <span className="text-2xs">{uploading ? 'Mengunggah…' : `Tambah (${remaining})`}</span>
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Maks {max} foto. Foto pertama menjadi sampul. Otomatis dikompres ke WebP.
      </p>
    </div>
  );
}
