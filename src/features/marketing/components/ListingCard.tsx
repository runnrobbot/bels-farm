import { Link } from 'react-router-dom';
import { ArrowUpRight, Scale } from 'lucide-react';
import type { CatalogAnimalRow } from '@/types/database';
import { paths } from '@/app/routes/paths';
import { formatCurrency, formatWeight } from '@/lib/utils';
import { Pill } from './shared';
import { SPECIES_ID } from '@/features/marketing/species';

/** Catalog card for a single listed animal. Shows a second gallery photo on
 * hover (crossfade) when available; falls back to a textured placeholder. */
export function ListingCard({ animal }: { animal: CatalogAnimalRow }) {
  const images = Array.from(
    new Set([animal.public_image_url, ...(animal.gallery_urls ?? [])].filter(Boolean) as string[]),
  );
  const cover = images[0];
  const hover = images[1];

  return (
    <Link
      to={paths.listing(animal.id)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-site-line bg-site-paper transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgba(34,56,32,0.4)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-site-moss-soft">
        {cover ? (
          <>
            <img
              src={cover}
              alt={animal.title}
              loading="lazy"
              decoding="async"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {hover && (
              <img
                src={hover}
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
            {images.length > 1 && (
              <span className="absolute bottom-3 right-3 rounded-full bg-site-ink/55 px-2 py-0.5 text-2xs font-medium text-white">
                {images.length} foto
              </span>
            )}
          </>
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-site-moss-soft to-site-sand">
            <span className="font-serif text-5xl font-semibold text-site-moss/40">
              {SPECIES_ID[animal.species]}
            </span>
          </div>
        )}
        <div className="absolute left-3 top-3 z-10 flex gap-1.5">
          <Pill tone="moss">{SPECIES_ID[animal.species]}</Pill>
          {animal.status === 'reserved' && <Pill tone="clay">Dipesan</Pill>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-semibold leading-snug text-site-ink">
          {animal.title}
        </h3>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-site-ink-soft">
          {animal.breed_name && <span>{animal.breed_name}</span>}
          {animal.current_weight_kg != null && (
            <span className="inline-flex items-center gap-1">
              <Scale className="size-3.5" /> {formatWeight(animal.current_weight_kg)}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-site-line pt-4">
          <div>
            <p className="text-xs text-site-ink-soft">Harga</p>
            <p className="font-semibold text-site-moss-dark">
              {animal.listing_price != null ? formatCurrency(animal.listing_price) : 'Hubungi kami'}
            </p>
          </div>
          <span className="flex size-9 items-center justify-center rounded-full bg-site-moss-soft text-site-moss-dark transition-colors group-hover:bg-site-moss group-hover:text-site-paper">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
