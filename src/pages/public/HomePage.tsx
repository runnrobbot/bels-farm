import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck, HeartPulse, Truck, Leaf, Star, ClipboardCheck } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { SITE, waMessage, WA_PRESETS } from '@/features/marketing/site';
import { useCatalog, useTestimonials, useArticles } from '@/features/marketing/hooks';
import { ListingCard } from '@/features/marketing/components/ListingCard';
import { SectionHeading, SiteButton, Pill } from '@/features/marketing/components/shared';
import { Reveal } from '@/components/site/Reveal';
import { useCountUp } from '@/hooks/useCountUp';
import { useParallax } from '@/hooks/useParallax';
import { anime, prefersReducedMotion } from '@/lib/animation/motion';
import { format } from 'date-fns';

function HeroStat({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  const n = useCountUp(value);
  return (
    <div>
      <dd className="font-serif text-3xl font-semibold text-site-ink tabular-nums">
        {n}
        {suffix}
      </dd>
      <dt className="mt-1 text-sm text-site-ink-soft">{label}</dt>
    </div>
  );
}

const WHY = [
  { icon: HeartPulse, title: 'Sehat & terkontrol', body: 'Vaksinasi dan pemeriksaan dokter hewan tercatat untuk tiap hewan.' },
  { icon: ClipboardCheck, title: 'Riwayat tercatat', body: 'Bobot, usia, dan asal-usul terdata rapi dan bisa Anda telusuri.' },
  { icon: ShieldCheck, title: 'Tanpa was-was', body: 'Anda tahu persis kondisi hewan sebelum membeli — bukan kucing dalam karung.' },
  { icon: Truck, title: 'Antar sampai tujuan', body: 'Pengiriman terkoordinasi untuk qurban dan aqiqah.' },
];

export default function HomePage() {
  const { data: catalog = [] } = useCatalog('all');
  const { data: testimonials = [] } = useTestimonials();
  const { data: articles = [] } = useArticles();
  const heroRef = useRef<HTMLDivElement>(null);
  const blobRef = useParallax<HTMLDivElement>(-0.18);

  useEffect(() => {
    const el = heroRef.current;
    if (prefersReducedMotion()) {
      document.querySelectorAll('[data-hero-img]').forEach((n) => ((n as HTMLElement).style.opacity = '1'));
      return;
    }
    if (el) {
      anime
        .timeline({ easing: 'cubicBezier(0.16, 1, 0.3, 1)' })
        .add({ targets: el.querySelectorAll('[data-hero]'), opacity: [0, 1], translateY: [34, 0], duration: 760, delay: anime.stagger(110) })
        .add({ targets: '[data-hero-img]', opacity: [0, 1], translateX: [40, 0], scale: [0.95, 1], duration: 820 }, '-=520');
    }
  }, []);

  const featured = catalog.slice(0, 3);

  return (
    <>
      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative overflow-hidden pt-32 sm:pt-40">
        <div ref={blobRef} className="pointer-events-none absolute -left-40 -top-24 size-[28rem] rounded-full bg-site-moss-soft blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-40 size-[22rem] rounded-full bg-site-clay/10 blur-3xl" />

        <div ref={heroRef} className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span data-hero className="inline-flex items-center gap-2 rounded-full border border-site-line bg-site-paper px-4 py-1.5 text-sm font-medium text-site-ink-soft">
              <Leaf className="size-4 text-site-moss" /> {SITE.tagline}
            </span>
            <h1 data-hero className="mt-6 font-serif text-5xl font-semibold leading-[1.04] tracking-tight text-site-ink sm:text-6xl">
              Ternak sehat,
              <br />
              <span className="text-site-moss">terdata</span>, siap antar.
            </h1>
            <p data-hero className="mt-6 max-w-lg text-lg leading-relaxed text-site-ink-soft">
              {SITE.name} menyediakan sapi, kambing, dan domba pilihan untuk qurban,
              aqiqah, dan penggemukan — dirawat dengan baik dan tercatat rapi.
            </p>
            <div data-hero className="mt-8 flex flex-wrap items-center gap-3">
              <SiteButton to={paths.catalog}>
                Lihat Katalog <ArrowUpRight className="size-4" />
              </SiteButton>
              <SiteButton href={waMessage(WA_PRESETS.general)} variant="outline">
                Konsultasi via WhatsApp
              </SiteButton>
            </div>

            <dl data-hero className="mt-12 grid max-w-md grid-cols-3 gap-6">
              <HeroStat value={100} suffix="%" label="Tercatat digital" />
              <HeroStat value={3} label="Jenis ternak" />
              <HeroStat value={catalog.length} suffix="+" label="Ternak tersedia" />
            </dl>
          </div>

          {/* Hero visual: real farm photo */}
          <div data-hero-img className="relative mx-auto w-full max-w-md opacity-0">
            <img
              src="/tentang-foto.png"
              alt="Peternakan BELS FARM"
              className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-2xl"
            />
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-site-ink/5" />
          </div>
        </div>
      </section>

      {/* ──────────────────── Why us — editorial numbered list ──────────────────── */}
      <section className="border-y border-site-line bg-site-paper py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal variant="left">
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-site-clay">
              Kenapa BELS FARM
            </span>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-tight text-site-ink sm:text-4xl">
              Beternak dengan hati, dikelola dengan data.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-site-ink-soft">
              Bukan sekadar jual-beli ternak. Kami merawat tiap hewan dan mencatat
              riwayatnya, supaya kepercayaan Anda terjaga.
            </p>
            <SiteButton to={paths.about} variant="outline" className="mt-6">
              Tentang kami <ArrowUpRight className="size-4" />
            </SiteButton>
          </Reveal>

          <Reveal variant="up" stagger className="grid gap-px overflow-hidden rounded-2xl border border-site-line bg-site-line sm:grid-cols-2">
            {WHY.map((f, i) => (
              <div key={f.title} className="bg-site-cream p-6">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-site-moss text-site-paper">
                    <f.icon className="size-5" />
                  </span>
                  <span className="font-serif text-2xl font-semibold text-site-sand">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-site-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-site-ink-soft">{f.body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ───────────────────── Featured catalog ───────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Katalog"
              title="Ternak yang sedang tersedia"
              description="Pilihan terbaru dari kandang kami."
              action={
                <SiteButton to={paths.catalog} variant="outline">
                  Semua katalog <ArrowUpRight className="size-4" />
                </SiteButton>
              }
            />
          </Reveal>

          {featured.length > 0 ? (
            <Reveal variant="up" stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((animal) => (
                <ListingCard key={animal.id} animal={animal} />
              ))}
            </Reveal>
          ) : (
            <Reveal variant="scale">
              <div className="mt-10 rounded-2xl border border-dashed border-site-line bg-site-paper p-10 text-center">
                <p className="text-site-ink-soft">
                  Belum ada ternak yang ditampilkan saat ini. Hubungi kami untuk
                  ketersediaan terbaru.
                </p>
                <div className="mt-5">
                  <SiteButton href={waMessage(WA_PRESETS.general)} variant="clay">
                    Tanya ketersediaan
                  </SiteButton>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ───────────────────── Qurban band ───────────────────── */}
      <section className="px-5 pb-20 sm:px-8">
        <Reveal variant="scale" className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-site-clay px-8 py-14 text-site-paper sm:px-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-site-paper/80">
                Tabungan Qurban
              </span>
              <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
                Wujudkan qurban dengan menabung cicilan ringan.
              </h2>
              <p className="mt-4 max-w-xl text-site-paper/85">
                Daftar online, tentukan jenis hewan, dan bayar bertahap. Tim kami bantu
                pantau setoran Anda sampai hari raya tiba.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <SiteButton to={paths.qurbanPublic} className="bg-site-paper text-site-clay-dark hover:bg-site-cream">
                Pelajari program <ArrowUpRight className="size-4" />
              </SiteButton>
              <SiteButton href={waMessage(WA_PRESETS.qurban)} variant="outline" className="border-site-paper/40 text-site-paper hover:bg-site-paper/10">
                Konsultasi qurban
              </SiteButton>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────────────────── Testimonials ───────────────────── */}
      {testimonials.length > 0 && (
        <section className="border-t border-site-line bg-site-paper py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal>
              <SectionHeading eyebrow="Testimoni" title="Kata para pelanggan" align="center" />
            </Reveal>
            <Reveal variant="up" stagger className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.slice(0, 3).map((t) => (
                <figure key={t.id} className="h-full rounded-2xl border border-site-line bg-site-cream p-6">
                  <div className="flex gap-0.5 text-site-honey">
                    {Array.from({ length: t.rating ?? 5 }).map((_, j) => (
                      <Star key={j} className="size-4" fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-site-ink">“{t.quote}”</blockquote>
                  <figcaption className="mt-5 text-sm">
                    <span className="font-semibold text-site-ink">{t.author_name}</span>
                    {t.author_role && <span className="text-site-ink-soft"> · {t.author_role}</span>}
                  </figcaption>
                </figure>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {/* ───────────────────── Latest articles ───────────────────── */}
      {articles.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal>
              <SectionHeading
                eyebrow="Edukasi"
                title="Artikel & tips peternakan"
                action={
                  <SiteButton to={paths.articles} variant="outline">
                    Semua artikel <ArrowUpRight className="size-4" />
                  </SiteButton>
                }
              />
            </Reveal>
            <Reveal variant="up" stagger className="mt-12 grid gap-6 md:grid-cols-3">
              {articles.slice(0, 3).map((a) => (
                <Link
                  key={a.id}
                  to={paths.article(a.slug)}
                  className="group block h-full rounded-2xl border border-site-line bg-site-paper p-6 transition-colors hover:border-site-moss/40"
                >
                  <Pill tone="sand">{a.category}</Pill>
                  <h3 className="mt-4 font-serif text-xl font-semibold leading-snug text-site-ink group-hover:text-site-moss-dark">
                    {a.title}
                  </h3>
                  {a.excerpt && <p className="mt-2 line-clamp-3 text-sm text-site-ink-soft">{a.excerpt}</p>}
                  {a.published_at && (
                    <p className="mt-4 text-xs text-site-ink-soft">
                      {format(new Date(a.published_at), 'd MMM yyyy')}
                    </p>
                  )}
                </Link>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {/* ───────────────────── Final CTA ───────────────────── */}
      <section className="px-5 pb-24 sm:px-8">
        <Reveal variant="scale" className="mx-auto max-w-4xl rounded-[2rem] border border-site-line bg-site-moss px-8 py-16 text-center text-site-paper">
          <h2 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl">
            Siap memilih ternak terbaik Anda?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-site-paper/80">
            Tim kami siap membantu menemukan sapi, kambing, atau domba yang paling
            sesuai dengan kebutuhan dan anggaran Anda.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <SiteButton href={waMessage(WA_PRESETS.general)} className="bg-site-paper text-site-moss-dark hover:bg-site-cream">
              Chat WhatsApp
            </SiteButton>
            <SiteButton to={paths.contact} variant="outline" className="border-site-paper/40 text-site-paper hover:bg-site-paper/10">
              Hubungi kami
            </SiteButton>
          </div>
        </Reveal>
      </section>
    </>
  );
}
