import { ClipboardList, Wallet, CalendarCheck, PartyPopper, ArrowUpRight } from 'lucide-react';
import { PageHero } from '@/components/site/PageHero';
import { Reveal } from '@/components/site/Reveal';
import { Seo } from '@/components/site/Seo';
import { usePublicQurbanPlans } from '@/features/marketing/hooks';
import { SectionHeading, SiteButton, Pill } from '@/features/marketing/components/shared';
import { SPECIES_ID } from '@/features/marketing/species';
import { waMessage, WA_PRESETS } from '@/features/marketing/site';
import { paths } from '@/app/routes/paths';
import { formatCurrency } from '@/lib/utils';

const STEPS = [
  { icon: ClipboardList, title: 'Daftar', body: 'Pilih jenis hewan qurban dan daftarkan diri Anda.' },
  { icon: Wallet, title: 'Menabung', body: 'Setor cicilan sesuai kemampuan, kapan saja.' },
  { icon: CalendarCheck, title: 'Dipantau', body: 'Tim kami memantau setoran dan mengingatkan Anda.' },
  { icon: PartyPopper, title: 'Qurban', body: 'Hewan disiapkan dan diantar tepat waktu saat hari raya.' },
];

export default function QurbanPage() {
  const { data: plans = [], isLoading } = usePublicQurbanPlans();

  return (
    <>
      <Seo
        title="Tabungan Qurban"
        description="Program tabungan qurban cicilan ringan di BELS FARM — daftar online, bayar bertahap, dipantau sampai hari raya."
        path="/qurban"
      />
      <PageHero
        eyebrow="Tabungan Qurban"
        title="Menabung sekarang, qurban dengan tenang"
        description="Program cicilan ringan untuk mewujudkan ibadah qurban Anda. Transparan, terpantau, dan dibantu sampai hari raya."
      >
        <div className="flex flex-wrap gap-3">
          <SiteButton to={paths.register}>
            Daftar Online <ArrowUpRight className="size-4" />
          </SiteButton>
          <SiteButton href={waMessage(WA_PRESETS.qurban)} variant="outline">
            Tanya via WhatsApp
          </SiteButton>
        </div>
      </PageHero>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <Reveal>
          <SectionHeading eyebrow="Cara Kerja" title="Empat langkah mudah" />
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <div className="relative h-full rounded-2xl border border-site-line bg-site-paper p-6">
                <span className="absolute right-5 top-5 font-serif text-3xl font-semibold text-site-sand">
                  {i + 1}
                </span>
                <span className="flex size-12 items-center justify-center rounded-xl bg-site-moss text-site-paper">
                  <s.icon className="size-6" />
                </span>
                <h3 className="mt-5 font-serif text-xl font-semibold text-site-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-site-ink-soft">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="border-t border-site-line bg-site-paper py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading eyebrow="Pilihan Paket" title="Paket tabungan tersedia" />
          </Reveal>

          {isLoading ? (
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-site-sand/60" />
              ))}
            </div>
          ) : plans.length > 0 ? (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan, i) => (
                <Reveal key={plan.id} delay={i * 90}>
                  <div className="flex h-full flex-col rounded-2xl border border-site-line bg-site-cream p-6">
                    <div className="flex items-center justify-between">
                      <Pill tone="moss">{SPECIES_ID[plan.species]}</Pill>
                      {plan.period_label && <span className="text-xs text-site-ink-soft">{plan.period_label}</span>}
                    </div>
                    <h3 className="mt-4 font-serif text-2xl font-semibold text-site-ink">{plan.name}</h3>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-site-ink-soft">Target</span>
                        <span className="font-semibold text-site-ink">{formatCurrency(plan.target_amount)}</span>
                      </div>
                      {plan.installment_amount != null && (
                        <div className="flex items-center justify-between">
                          <span className="text-site-ink-soft">Cicilan / setoran</span>
                          <span className="font-semibold text-site-moss-dark">
                            {formatCurrency(plan.installment_amount)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-auto pt-6">
                      <SiteButton to={paths.register} className="w-full">
                        Pilih paket ini
                      </SiteButton>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-site-line bg-site-cream p-12 text-center">
              <p className="text-site-ink-soft">
                Paket tabungan qurban akan segera dibuka. Tinggalkan pesan dan kami
                hubungi Anda saat pendaftaran dibuka.
              </p>
              <div className="mt-5">
                <SiteButton href={waMessage(WA_PRESETS.qurban)} variant="clay">
                  Daftar minat
                </SiteButton>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
