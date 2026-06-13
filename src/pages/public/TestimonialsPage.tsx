import { Star, Quote, MessagesSquare } from 'lucide-react';
import { PageHero } from '@/components/site/PageHero';
import { Reveal } from '@/components/site/Reveal';
import { useTestimonials } from '@/features/marketing/hooks';
import { SiteButton } from '@/features/marketing/components/shared';
import { waMessage, WA_PRESETS } from '@/features/marketing/site';

export default function TestimonialsPage() {
  const { data: testimonials = [], isLoading } = useTestimonials();

  return (
    <>
      <PageHero
        eyebrow="Testimoni"
        title="Cerita dari pelanggan kami"
        description="Kepercayaan mereka adalah alasan kami terus memberi yang terbaik."
      />

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-site-sand/60" />
            ))}
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.id} delay={Math.min(i, 6) * 70}>
                <figure className="flex h-full flex-col rounded-2xl border border-site-line bg-site-paper p-6">
                  <Quote className="size-7 text-site-moss/30" />
                  <blockquote className="mt-3 flex-1 text-site-ink">“{t.quote}”</blockquote>
                  <div className="mt-5 flex items-center justify-between">
                    <figcaption className="text-sm">
                      <span className="font-semibold text-site-ink">{t.author_name}</span>
                      {t.author_role && <span className="block text-site-ink-soft">{t.author_role}</span>}
                    </figcaption>
                    <div className="flex gap-0.5 text-site-honey">
                      {Array.from({ length: t.rating ?? 5 }).map((_, j) => (
                        <Star key={j} className="size-4" fill="currentColor" strokeWidth={0} />
                      ))}
                    </div>
                  </div>
                </figure>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-site-line bg-site-paper p-14 text-center">
            <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-site-moss-soft text-site-moss">
              <MessagesSquare className="size-7" />
            </span>
            <h3 className="font-serif text-xl font-semibold text-site-ink">Belum ada testimoni</h3>
            <p className="mx-auto mt-2 max-w-md text-site-ink-soft">
              Jadilah pelanggan kami dan bagikan pengalaman Anda di sini.
            </p>
            <div className="mt-6">
              <SiteButton href={waMessage(WA_PRESETS.general)} variant="clay">
                Mulai dari WhatsApp
              </SiteButton>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
