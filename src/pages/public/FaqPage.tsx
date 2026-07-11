import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PageHero } from '@/components/site/PageHero';
import { Seo } from '@/components/site/Seo';
import { SiteButton } from '@/features/marketing/components/shared';
import { waMessage, WA_PRESETS } from '@/features/marketing/site';
import { prefersReducedMotion } from '@/lib/animation/motion';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: 'Bagaimana cara membeli ternak di BELS FARM?',
    a: 'Pilih ternak di halaman Katalog, lalu klik "Pesan via WhatsApp". Tim kami akan membantu memastikan ketersediaan, harga, dan pengaturan pengiriman.',
  },
  {
    q: 'Apakah hewan dijamin sehat?',
    a: 'Ya. Setiap hewan menjalani pemeriksaan dan pencatatan kesehatan. Riwayat vaksinasi serta penimbangan bobot tersimpan dan dapat kami tunjukkan.',
  },
  {
    q: 'Bagaimana sistem Tabungan Qurban bekerja?',
    a: 'Anda mendaftar, memilih jenis hewan, lalu menyetor cicilan secara bertahap. Kami memantau setoran dan menyiapkan hewan tepat waktu menjelang hari raya.',
  },
  {
    q: 'Apakah tersedia layanan pengiriman?',
    a: 'Tersedia. Kami mengoordinasikan pengiriman ke lokasi Anda, termasuk untuk kebutuhan qurban dan aqiqah. Biaya menyesuaikan jarak.',
  },
  {
    q: 'Metode pembayaran apa saja yang diterima?',
    a: 'Kami menerima transfer bank dan pembayaran bertahap untuk program tabungan. Detail akan dijelaskan oleh tim kami via WhatsApp.',
  },
  {
    q: 'Apakah bisa melihat ternak langsung sebelum membeli?',
    a: 'Tentu. Anda dapat membuat janji kunjungan ke kandang. Hubungi kami melalui WhatsApp untuk mengatur jadwal.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (bodyRef.current && !prefersReducedMotion()) {
      const el = bodyRef.current;
      const target = next ? el.scrollHeight : 0;
      el.style.height = `${target}px`;
      el.style.opacity = next ? '1' : '0';
      if (next) el.style.height = 'auto';
    }
  };

  return (
    <div className="border-b border-site-line">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="font-serif text-lg font-medium text-site-ink">{q}</span>
        <ChevronDown
          className={cn('size-5 shrink-0 text-site-moss transition-transform duration-300', open && 'rotate-180')}
        />
      </button>
      <div ref={bodyRef} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
        <p className="pb-5 leading-relaxed text-site-ink-soft">{a}</p>
      </div>
    </div>
  );
}

export default function FaqPage() {
  return (
    <>
      <Seo
        title="FAQ — Pertanyaan yang Sering Diajukan"
        description="Jawaban seputar pembelian ternak, jaminan kesehatan, Tabungan Qurban, pengiriman, dan pembayaran di BELS FARM."
        path="/faq"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQS.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }}
      />
      <PageHero
        eyebrow="FAQ"
        title="Pertanyaan yang sering diajukan"
        description="Belum menemukan jawaban? Tim kami siap membantu lewat WhatsApp."
      />

      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
        <div className="rounded-2xl border border-site-line bg-site-paper px-6 sm:px-8">
          {FAQS.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-site-moss-soft p-8 text-center">
          <h3 className="font-serif text-xl font-semibold text-site-ink">Masih ada pertanyaan?</h3>
          <p className="mt-2 text-site-ink-soft">Kami senang membantu Anda.</p>
          <div className="mt-5">
            <SiteButton href={waMessage(WA_PRESETS.general)} variant="clay">
              Tanya via WhatsApp
            </SiteButton>
          </div>
        </div>
      </section>
    </>
  );
}
