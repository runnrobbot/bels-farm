import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Scale, Calendar, Palette, Dna, MessageCircle, ShieldCheck } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { useListing } from '@/features/marketing/hooks';
import { Pill, SiteButton } from '@/features/marketing/components/shared';
import { Seo } from '@/components/site/Seo';
import { SPECIES_ID } from '@/features/marketing/species';
import { waMessage, WA_PRESETS } from '@/features/marketing/site';
import { formatCurrency, formatWeight } from '@/lib/utils';
import { differenceInMonths } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: animal, isLoading } = useListing(id);
  const [activeImg, setActiveImg] = useState(0);

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-5 pt-40 sm:px-8"><div className="h-96 animate-pulse rounded-3xl bg-site-sand/60" /></div>;
  }

  if (!animal) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pt-44 text-center sm:px-8">
        <h1 className="font-serif text-3xl font-semibold text-site-ink">Ternak tidak ditemukan</h1>
        <p className="mt-3 text-site-ink-soft">Ternak ini mungkin sudah terjual atau tidak lagi ditampilkan.</p>
        <Link to={paths.catalog} className="mt-6 inline-flex items-center gap-2 rounded-full bg-site-moss px-6 py-3 text-sm font-medium text-site-paper">
          <ArrowLeft className="size-4" /> Kembali ke katalog
        </Link>
      </div>
    );
  }

  const ageMonths = animal.birth_date
    ? differenceInMonths(new Date(), new Date(animal.birth_date))
    : null;

  const images = Array.from(
    new Set([animal.public_image_url, ...(animal.gallery_urls ?? [])].filter(Boolean) as string[]),
  );
  const mainImage = images[activeImg] ?? images[0];

  const facts = [
    { icon: Dna, label: 'Ras', value: animal.breed_name ?? '—' },
    { icon: Scale, label: 'Bobot', value: formatWeight(animal.current_weight_kg) },
    { icon: Calendar, label: 'Usia', value: ageMonths != null ? `${ageMonths} bln` : '—' },
    { icon: Palette, label: 'Warna', value: animal.color ?? '—' },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
      <Seo
        title={animal.title}
        description={
          animal.listing_description ??
          `${SPECIES_ID[animal.species]} ${animal.breed_name ?? ''} berkualitas dari BELS FARM.`.trim()
        }
        path={paths.listing(animal.id)}
        image={mainImage ?? undefined}
        type="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: animal.title,
          description: animal.listing_description ?? undefined,
          image: images.length > 0 ? images : undefined,
          category: SPECIES_ID[animal.species],
          brand: { '@type': 'Brand', name: 'BELS FARM' },
          ...(animal.listing_price != null && {
            offers: {
              '@type': 'Offer',
              price: animal.listing_price,
              priceCurrency: 'IDR',
              availability:
                animal.status === 'reserved'
                  ? 'https://schema.org/PreOrder'
                  : 'https://schema.org/InStock',
            },
          }),
        }}
      />
      <Link to={paths.catalog} className="inline-flex items-center gap-1.5 text-sm text-site-ink-soft transition-colors hover:text-site-ink">
        <ArrowLeft className="size-4" /> Katalog
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-3xl border border-site-line bg-site-moss-soft">
            {mainImage ? (
              <img src={mainImage} alt={animal.title} className="aspect-square size-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-site-moss-soft to-site-sand">
                <span className="font-serif text-6xl font-semibold text-site-moss/40">{SPECIES_ID[animal.species]}</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    'size-16 overflow-hidden rounded-lg border-2 transition-colors',
                    i === activeImg ? 'border-site-moss' : 'border-site-line hover:border-site-moss/50',
                  )}
                >
                  <img src={src} alt={`Foto ${i + 1}`} className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex gap-2">
            <Pill tone="moss">{SPECIES_ID[animal.species]}</Pill>
            {animal.status === 'reserved' && <Pill tone="clay">Dipesan</Pill>}
          </div>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-site-ink">{animal.title}</h1>

          <div className="mt-6 rounded-2xl bg-site-paper p-5">
            <p className="text-sm text-site-ink-soft">Harga</p>
            <p className="font-serif text-3xl font-semibold text-site-moss-dark">
              {animal.listing_price != null ? formatCurrency(animal.listing_price) : 'Hubungi kami'}
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4">
            {facts.map((f) => (
              <div key={f.label} className="rounded-xl border border-site-line bg-site-paper p-4">
                <dt className="flex items-center gap-1.5 text-xs text-site-ink-soft">
                  <f.icon className="size-3.5" /> {f.label}
                </dt>
                <dd className="mt-1 font-semibold capitalize text-site-ink">{f.value}</dd>
              </div>
            ))}
          </dl>

          {animal.listing_description && (
            <p className="mt-6 leading-relaxed text-site-ink-soft">{animal.listing_description}</p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <SiteButton href={waMessage(WA_PRESETS.listing(animal.title))} variant="clay">
              <MessageCircle className="size-4" /> Pesan via WhatsApp
            </SiteButton>
            <SiteButton to={paths.contact} variant="outline">
              Tanya detail
            </SiteButton>
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-site-ink-soft">
            <ShieldCheck className="size-4 text-site-moss" />
            Riwayat kesehatan & bobot tercatat dan dapat ditelusuri.
          </p>
        </div>
      </div>
    </section>
  );
}
