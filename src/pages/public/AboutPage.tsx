import { Sprout, HeartHandshake, BadgeCheck, ArrowUpRight } from 'lucide-react';
import { PageHero } from '@/components/site/PageHero';
import { Reveal } from '@/components/site/Reveal';
import { Seo } from '@/components/site/Seo';
import { SectionHeading, SiteButton } from '@/features/marketing/components/shared';
import { SITE } from '@/features/marketing/site';
import { paths } from '@/app/routes/paths';

const VALUES = [
  { icon: HeartHandshake, title: 'Amanah', body: 'Kami menjual sesuai kondisi sebenarnya — bobot dan kesehatan apa adanya.' },
  { icon: BadgeCheck, title: 'Berkualitas', body: 'Ternak dirawat dengan pakan dan penanganan kesehatan yang baik.' },
  { icon: Sprout, title: 'Berkelanjutan', body: 'Praktik beternak yang menjaga kesejahteraan hewan dan lingkungan.' },
];

export default function AboutPage() {
  return (
    <>
      <Seo title="Tentang Kami" path="/about" />
      <PageHero
        eyebrow="Tentang Kami"
        title={`Beternak dengan hati, dikelola dengan data`}
        description={`${SITE.name} adalah peternakan yang fokus pada sapi, kambing, dan domba berkualitas — memadukan cara beternak yang baik dengan pencatatan modern.`}
      />

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal variant="left">
            <div className="relative">
              <img
                src="/tentang-foto.png"
                alt="Peternakan BELS FARM"
                className="aspect-[4/3] w-full rounded-3xl object-cover shadow-xl"
              />
              <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-site-ink/5" />
              <div className="absolute -bottom-5 -right-5 max-w-[15rem] rounded-2xl border border-site-line bg-site-paper p-4 shadow-lg">
                <p className="font-serif text-base leading-snug text-site-ink">
                  “Hewan sehat & terdata adalah amanah yang kami jaga.”
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal variant="right" delay={120}>
            <SectionHeading eyebrow="Cerita Kami" title="Dari kandang untuk keluarga Anda" />
            <div className="mt-5 space-y-4 leading-relaxed text-site-ink-soft">
              <p>
                {SITE.name} lahir dari keinginan sederhana: memudahkan masyarakat
                mendapatkan ternak berkualitas untuk qurban, aqiqah, dan kebutuhan
                konsumsi — tanpa rasa khawatir tentang kondisi hewan.
              </p>
              <p>
                Setiap sapi, kambing, dan domba kami catat bobot serta riwayat
                kesehatannya. Anda tidak membeli "kucing dalam karung"; Anda membeli
                hewan dengan data yang jelas.
              </p>
              <p>
                Kini kami terus berkembang, siap melayani lebih banyak keluarga dengan
                pelayanan yang ramah dan dapat dipercaya.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-site-line bg-site-paper py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading eyebrow="Nilai Kami" title="Yang kami pegang teguh" align="center" />
          </Reveal>
          <Reveal variant="up" stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="h-full rounded-2xl border border-site-line bg-site-cream p-7 text-center">
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-site-moss text-site-paper">
                  <v.icon className="size-7" />
                </span>
                <h3 className="mt-5 font-serif text-xl font-semibold text-site-ink">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-site-ink-soft">{v.body}</p>
              </div>
            ))}
          </Reveal>
          <Reveal className="mt-14 text-center">
            <SiteButton to={paths.catalog}>
              Lihat ternak kami <ArrowUpRight className="size-4" />
            </SiteButton>
          </Reveal>
        </div>
      </section>
    </>
  );
}
