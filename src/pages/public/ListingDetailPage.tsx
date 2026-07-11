import { useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Scale, Calendar, Palette, Dna, MessageCircle, ShieldCheck, ShoppingCart, Upload, Loader2 } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { useListing } from '@/features/marketing/hooks';
import { Pill, SiteButton } from '@/features/marketing/components/shared';
import { Seo } from '@/components/site/Seo';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { SPECIES_ID } from '@/features/marketing/species';
import { waMessage, WA_PRESETS } from '@/features/marketing/site';
import { formatCurrency, formatWeight } from '@/lib/utils';
import { differenceInMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSubmitAnimalPurchase } from '@/features/animal-purchases/service';
import { toast } from '@/stores/toastStore';

const BCA_ACCOUNT = 'BCA 7615311201\nAN MUHAMAD LABIB AZHAR';

// Anti-spam: honeypot field — bots fill this, humans don't see it.
const HONEYPOT_DELAY_MS = 3000;

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: animal, isLoading } = useListing(id);
  const [activeImg, setActiveImg] = useState(0);
  const [purchasing, setPurchasing] = useState(false);

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
  const canBuy = animal.status === 'active' && animal.listing_price != null;

  const facts = [
    { icon: Dna, label: 'Ras', value: animal.breed_name ?? '—' },
    { icon: Scale, label: 'Bobot', value: formatWeight(animal.current_weight_kg) },
    { icon: Calendar, label: 'Usia', value: ageMonths != null ? `${ageMonths} bln` : '—' },
    { icon: Palette, label: 'Warna', value: animal.color ?? '—' },
  ];

  return (
    <>
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
      <section className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
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
              {canBuy && (
                <button
                  onClick={() => setPurchasing(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-site-moss px-6 py-3 text-sm font-semibold text-site-paper transition-colors hover:bg-site-moss-dark"
                >
                  <ShoppingCart className="size-4" /> Beli Langsung
                </button>
              )}
              <SiteButton href={waMessage(WA_PRESETS.listing(animal.title))} variant="outline">
                <MessageCircle className="size-4" /> Tanya via WhatsApp
              </SiteButton>
            </div>

            <p className="mt-6 flex items-center gap-2 text-sm text-site-ink-soft">
              <ShieldCheck className="size-4 text-site-moss" />
              Riwayat kesehatan & bobot tercatat dan dapat ditelusuri.
            </p>
          </div>
        </div>
      </section>

      {purchasing && (
        <PurchaseModal
          animal={animal}
          onClose={() => setPurchasing(false)}
        />
      )}
    </>
  );
}

function PurchaseModal({ animal, onClose }: { animal: NonNullable<ReturnType<typeof useListing>['data']>; onClose: () => void }) {
  const submit = useSubmitAnimalPurchase();
  const [amount, setAmount] = useState(animal.listing_price?.toString() ?? '');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [namaPengurban, setNamaPengurban] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  // Anti-spam: record when form renders. If submitted in <3s, likely a bot.
  const formLoadedAt = useRef(Date.now());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setProofFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setProofPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setProofPreview(null);
    }
  };

  const validate = () => {
    if (!buyerName.trim()) { toast.error('Nama lengkap wajib diisi'); return false; }
    if (!buyerPhone.trim()) { toast.error('No. HP wajib diisi'); return false; }
    if (!/^\d{8,15}$/.test(buyerPhone.replace(/\s|-|\(|\)/g, ''))) { toast.error('No. HP tidak valid'); return false; }
    if (!buyerAddress.trim()) { toast.error('Alamat lengkap wajib diisi'); return false; }
    if (!namaPengurban.trim()) { toast.error('Nama pengurban wajib diisi'); return false; }
    if (!amount || Number(amount) <= 0) { toast.error('Nominal tidak valid'); return false; }
    if (!proofFile) { toast.error('Wajib upload bukti transfer'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    // Anti-spam: honeypot — if filled, silently reject
    if (honeypotRef.current?.value) return;
    // Anti-spam: fill-time — reject if form filled in <3s
    if (Date.now() - formLoadedAt.current < HONEYPOT_DELAY_MS) {
      toast.error('Terlalu cepat. Silakan isi formulir dengan wajar.');
      return;
    }
    if (!validate()) return;

    setUploading(true);
    try {
      await submit.mutateAsync({
        animalId: animal.id,
        amount: Number(amount),
        proofFile: proofFile!, // validated above
        buyer: {
          name: buyerName.trim(),
          phone: buyerPhone.trim(),
          address: buyerAddress.trim(),
          namaPengurban: namaPengurban.trim(),
        },
      });
      onClose();
    } catch {
      setUploading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Beli Langsung"
      description={animal.title}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submit.isPending || uploading}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submit.isPending || uploading ? <Loader2 className="size-4 animate-spin" /> : null}
            Kirim Permintaan
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* BCA Account */}
        <div className="rounded-xl border-2 border-site-moss/40 bg-site-moss-soft/50 p-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-site-moss-dark">Transfer ke rekening</p>
          <p className="whitespace-pre-line font-mono text-sm font-semibold text-site-ink">{BCA_ACCOUNT}</p>
        </div>

        {/* Buyer info */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama Lengkap" required className="sm:col-span-2">
            <Input
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Nama sesuai KTP"
            />
          </Field>
          <Field label="No. HP / WhatsApp" required>
            <Input
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              type="tel"
            />
          </Field>
          <Field label="Nama Pengurban" required>
            <Input
              value={namaPengurban}
              onChange={(e) => setNamaPengurban(e.target.value)}
              placeholder="Nama orang yg akan qurban"
            />
          </Field>
          <Field label="Alamat Lengkap" required className="sm:col-span-2">
            <Input
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              placeholder="Desa/Kecamatan/Kabupaten"
            />
          </Field>
        </div>

        {/* Amount */}
        <Field label="Nominal (Rp)" required>
          <Input
            type="number"
            step="10000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </Field>
        {animal.listing_price && (
          <p className="-mt-1 text-xs text-site-ink-soft">
            Harga hewan: <span className="font-medium text-site-ink">{formatCurrency(animal.listing_price)}</span>
          </p>
        )}

        {/* Proof upload */}
        <Field label="Bukti Transfer" required>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-lg border border-dashed border-site-line bg-site-paper px-4 py-3 text-sm text-site-ink-soft transition-colors hover:border-site-moss hover:text-site-ink"
          >
            <Upload className="size-5 text-site-moss" />
            {proofFile ? proofFile.name : 'Upload screenshot bukti transfer'}
          </button>
          {proofPreview && (
            <div className="mt-2 overflow-hidden rounded-lg border border-site-line">
              <img src={proofPreview} alt="Preview" className="max-h-48 w-full object-contain bg-site-sand" />
            </div>
          )}
        </Field>

        {/* Honeypot — invisible, bots fill it */}
        <input
          ref={honeypotRef}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="absolute -z-10 h-px w-px overflow-hidden opacity-0"
          aria-hidden="true"
        />

        <p className="text-xs text-site-ink-soft">
          Permintaan akan ditinjau admin. Anda akan dihubungi setelah pembayaran dikonfirmasi.
        </p>
      </div>
    </Modal>
  );
}
