import { useMemo, useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { PageHero } from '@/components/site/PageHero';
import { Reveal } from '@/components/site/Reveal';
import { useCatalog } from '@/features/marketing/hooks';
import { SiteButton } from '@/features/marketing/components/shared';
import { SPECIES_ID } from '@/features/marketing/species';
import { waMessage, WA_PRESETS } from '@/features/marketing/site';

interface GalleryImage {
  url: string;
  caption: string;
}

export default function GalleryPage() {
  const { data: catalog = [], isLoading } = useCatalog('all');
  const [active, setActive] = useState<GalleryImage | null>(null);

  const images = useMemo<GalleryImage[]>(
    () =>
      catalog.flatMap((a) => {
        const urls = Array.from(
          new Set([a.public_image_url, ...(a.gallery_urls ?? [])].filter(Boolean) as string[]),
        );
        return urls.map((url) => ({ url, caption: `${SPECIES_ID[a.species]} • ${a.title}` }));
      }),
    [catalog],
  );

  return (
    <>
      <PageHero
        eyebrow="Galeri"
        title="Potret kandang & ternak kami"
        description="Sekilas suasana peternakan dan ternak yang kami rawat."
      />

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-site-sand/60" />
            ))}
          </div>
        ) : images.length > 0 ? (
          <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
            {images.map((img, i) => (
              <Reveal key={img.url + i} delay={Math.min(i, 8) * 50}>
                <button
                  onClick={() => setActive(img)}
                  className="group block w-full overflow-hidden rounded-2xl border border-site-line"
                >
                  <img
                    src={img.url}
                    alt={img.caption}
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </button>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-site-line bg-site-paper p-14 text-center">
            <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-site-moss-soft text-site-moss">
              <ImageIcon className="size-7" />
            </span>
            <h3 className="font-serif text-xl font-semibold text-site-ink">Galeri segera hadir</h3>
            <p className="mx-auto mt-2 max-w-md text-site-ink-soft">
              Foto-foto ternak akan tampil di sini. Sementara itu, hubungi kami untuk
              melihat ketersediaan terbaru.
            </p>
            <div className="mt-6">
              <SiteButton href={waMessage(WA_PRESETS.general)} variant="clay">
                Hubungi kami
              </SiteButton>
            </div>
          </div>
        )}
      </section>

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-site-ink/90 p-4 animate-fade-in"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            className="absolute right-5 top-5 flex size-11 items-center justify-center rounded-full bg-site-paper/15 text-site-paper hover:bg-site-paper/25"
            aria-label="Tutup"
          >
            <X className="size-5" />
          </button>
          <figure onClick={(e) => e.stopPropagation()} className="max-h-[85dvh] max-w-3xl">
            <img src={active.url} alt={active.caption} className="max-h-[78dvh] rounded-2xl object-contain" />
            <figcaption className="mt-3 text-center text-sm text-site-paper/80">{active.caption}</figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
