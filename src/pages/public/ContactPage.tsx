import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, Instagram, MapPin, Clock, Send } from 'lucide-react';
import { PageHero } from '@/components/site/PageHero';
import { Reveal } from '@/components/site/Reveal';
import { SITE, waMessage } from '@/features/marketing/site';

const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  whatsapp: z.string().min(8, 'Nomor WhatsApp tidak valid'),
  topic: z.string().min(1, 'Pilih topik'),
  message: z.string().min(5, 'Pesan terlalu pendek'),
});
type FormValues = z.infer<typeof schema>;

const TOPICS = ['Pembelian ternak', 'Tabungan Qurban', 'Aqiqah', 'Pengiriman', 'Lainnya'];

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { topic: TOPICS[0] } });

  // The form is "functional" without a backend: it composes a structured
  // WhatsApp message and opens the chat — the channel Indonesian buyers expect.
  const onSubmit = (values: FormValues) => {
    const text = [
      `Halo ${SITE.name}!`,
      `Nama: ${values.name}`,
      `WhatsApp: ${values.whatsapp}`,
      `Topik: ${values.topic}`,
      '',
      values.message,
    ].join('\n');
    window.open(waMessage(text), '_blank', 'noopener,noreferrer');
  };

  const info = [
    { icon: Phone, label: 'WhatsApp', value: `+${SITE.whatsapp}`, href: waMessage('Halo BELS FARM!') },
    { icon: Instagram, label: 'Instagram', value: SITE.instagramHandle, href: SITE.instagram },
    { icon: MapPin, label: 'Lokasi', value: SITE.address, href: undefined },
    { icon: Clock, label: 'Jam operasional', value: SITE.hours, href: undefined },
  ];

  const inputCls =
    'w-full rounded-xl border border-site-line bg-site-paper px-4 py-3 text-sm text-site-ink placeholder:text-site-ink-soft/60 focus:border-site-moss focus:outline-none focus:ring-2 focus:ring-site-moss/20';

  return (
    <>
      <PageHero
        eyebrow="Kontak"
        title="Mari bicara"
        description="Ada pertanyaan tentang ternak atau program kami? Kirim pesan, kami balas cepat via WhatsApp."
      />

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          {/* Info */}
          <Reveal>
            <div className="space-y-4">
              {info.map((item) => (
                <div key={item.label} className="flex items-start gap-4 rounded-2xl border border-site-line bg-site-paper p-5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-site-moss text-site-paper">
                    <item.icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-site-ink-soft">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 block font-medium text-site-ink hover:text-site-moss"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="mt-0.5 font-medium text-site-ink">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Form */}
          <Reveal delay={120}>
            <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-site-line bg-site-cream p-6 sm:p-8" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-site-ink">Nama</label>
                  <input className={inputCls} placeholder="Nama Anda" {...register('name')} />
                  {errors.name && <p className="mt-1 text-xs text-site-clay-dark">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-site-ink">No. WhatsApp</label>
                  <input className={inputCls} placeholder="08xxxxxxxxxx" {...register('whatsapp')} />
                  {errors.whatsapp && <p className="mt-1 text-xs text-site-clay-dark">{errors.whatsapp.message}</p>}
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-1.5 block text-sm font-medium text-site-ink">Topik</label>
                <select className={inputCls} {...register('topic')}>
                  {TOPICS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="mt-5">
                <label className="mb-1.5 block text-sm font-medium text-site-ink">Pesan</label>
                <textarea rows={5} className={inputCls} placeholder="Tulis pesan Anda…" {...register('message')} />
                {errors.message && <p className="mt-1 text-xs text-site-clay-dark">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-site-clay px-6 py-3.5 text-sm font-medium text-site-paper transition-colors hover:bg-site-clay-dark"
              >
                <Send className="size-4" /> Kirim via WhatsApp
              </button>
              <p className="mt-3 text-center text-xs text-site-ink-soft">
                Pesan akan terbuka di WhatsApp dengan detail yang sudah terisi.
              </p>
            </form>
          </Reveal>
        </div>

        {/* Map */}
        <Reveal className="mt-10 overflow-hidden rounded-2xl border border-site-line">
          <iframe
            title="Lokasi BELS FARM"
            src={SITE.mapsEmbed}
            className="h-72 w-full sm:h-96"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </Reveal>
      </section>
    </>
  );
}
