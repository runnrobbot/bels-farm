import { Link, useParams } from 'react-router-dom';
import { Beef, PackageOpen } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { SITE, waMessage, WA_PRESETS } from '@/features/marketing/site';
import { useCatalog } from '@/features/marketing/hooks';
import { ListingCard } from '@/features/marketing/components/ListingCard';
import { SiteButton } from '@/features/marketing/components/shared';
import { SPECIES_ID, SPECIES_LIST } from '@/features/marketing/species';
import { Reveal } from '@/components/site/Reveal';
import { PageHero } from '@/components/site/PageHero';
import { Seo } from '@/components/site/Seo';
import type { Species } from '@/types/database';
import { cn } from '@/lib/utils';

const VALID = new Set<string>(SPECIES_LIST);

export default function CatalogPage() {
  const { species } = useParams<{ species?: string }>();
  const active: Species | 'all' = species && VALID.has(species) ? (species as Species) : 'all';
  const { data: animals = [], isLoading } = useCatalog(active);

  const tabs: { key: Species | 'all'; label: string; to: string }[] = [
    { key: 'all', label: 'Semua', to: paths.catalog },
    ...SPECIES_LIST.map((s) => ({ key: s, label: SPECIES_ID[s], to: paths.catalogSpecies(s) })),
  ];

  return (
    <>
      <Seo
        title="Katalog Ternak"
        description="Telusuri sapi, kambing, dan domba yang tersedia di BELS FARM — lengkap dengan bobot dan informasi transparan."
        path="/catalog"
      />
      <PageHero
        eyebrow="Katalog Ternak"
        title="Sapi, kambing & domba pilihan"
        description="Telusuri ternak yang tersedia. Setiap hewan disertai bobot dan informasi yang transparan."
      />

      <section className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8">
        {/* Species filter — segmented control (no per-pill borders → no overlap) */}
        <div className="mb-10 flex">
          <div className="inline-flex max-w-full flex-wrap gap-1 rounded-full border border-site-line bg-site-paper p-1">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                to={tab.to}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                  active === tab.key
                    ? 'bg-site-moss text-site-paper shadow-sm'
                    : 'text-site-ink-soft hover:bg-site-moss-soft hover:text-site-ink',
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-site-sand/60" />
            ))}
          </div>
        ) : animals.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {animals.map((animal, i) => (
              <Reveal key={animal.id} delay={Math.min(i, 6) * 70}>
                <ListingCard animal={animal} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-site-line bg-site-paper p-14 text-center">
            <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-site-moss-soft text-site-moss">
              {active === 'all' ? <PackageOpen className="size-7" /> : <Beef className="size-7" />}
            </span>
            <h3 className="font-serif text-xl font-semibold text-site-ink">
              Belum ada {active === 'all' ? 'ternak' : SPECIES_ID[active]} yang ditampilkan
            </h3>
            <p className="mx-auto mt-2 max-w-md text-site-ink-soft">
              Stok kami berubah cepat. Hubungi {SITE.name} untuk menanyakan
              ketersediaan terbaru.
            </p>
            <div className="mt-6">
              <SiteButton href={waMessage(WA_PRESETS.general)} variant="clay">
                Tanya via WhatsApp
              </SiteButton>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
