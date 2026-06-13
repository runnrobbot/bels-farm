import { useEffect, useRef, useState } from 'react';
import { PiggyBank, Plus, CheckCircle2, Clock, Upload, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePublicQurbanPlans } from '@/features/marketing/hooks';
import {
  usePortalOverview,
  ensureMyCustomer,
  useEnroll,
  useSubmitPayment,
  type PortalEnrollment,
} from '@/features/portal/service';
import { useAuth } from '@/features/auth/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { uploadPrivateImage } from '@/lib/storage';
import { payWithMidtrans } from '@/lib/midtrans';
import { printReceipt } from '@/features/portal/printReceipt';
import { env } from '@/config/env';
import { toast } from '@/stores/toastStore';
import { formatCurrency } from '@/lib/utils';
import { SPECIES_ID } from '@/features/marketing/species';
import { format } from 'date-fns';

export default function PortalQurbanPage() {
  const { profile, session } = useAuth();
  const qc = useQueryClient();
  const { data: overview, isLoading } = usePortalOverview();
  const { data: plans = [] } = usePublicQurbanPlans();
  const enroll = useEnroll();
  const ensured = useRef(false);

  const [payFor, setPayFor] = useState<PortalEnrollment | null>(null);

  // Make sure a customer record exists for this account (once). The WhatsApp
  // number may live in auth metadata when the account was created with email
  // confirmation enabled (the customer row isn't created until first sign-in).
  useEffect(() => {
    if (ensured.current || !profile) return;
    ensured.current = true;
    const meta = session?.user.user_metadata;
    const metaWhatsapp = typeof meta?.whatsapp === 'string' ? meta.whatsapp : '';
    const whatsapp = profile.phone ?? metaWhatsapp;
    void ensureMyCustomer(profile.full_name, whatsapp).then(() =>
      qc.invalidateQueries({ queryKey: ['portal', 'qurban'] }),
    );
  }, [profile, session, qc]);

  const enrolledPlanIds = new Set(overview?.enrollments.map((e) => e.plan.id) ?? []);
  const availablePlans = plans.filter((p) => !enrolledPlanIds.has(p.id));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Tabungan Qurban Saya</h1>
        <p className="mt-1.5 text-site-ink-soft">
          Pantau progres tabungan, kirim setoran, dan lihat statusnya kapan saja.
        </p>
      </div>

      {/* My enrollments */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Tabungan aktif</h2>
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-site-sand/60" />
        ) : overview && overview.enrollments.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {overview.enrollments.map((e) => (
              <EnrollmentCard
                key={e.id}
                enrollment={e}
                customerName={overview.customer?.full_name ?? profile?.full_name ?? 'Pelanggan'}
                onPay={() => setPayFor(e)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={PiggyBank}
            title="Belum ada tabungan"
            description="Pilih paket di bawah untuk mulai menabung qurban."
          />
        )}
      </section>

      {/* Available plans */}
      {availablePlans.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Pilih paket</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {availablePlans.map((p) => (
              <div key={p.id} className="flex flex-col rounded-2xl border border-site-line bg-site-paper p-5">
                <Badge tone="primary">{SPECIES_ID[p.species]}</Badge>
                <h3 className="mt-3 font-serif text-xl font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-site-ink-soft">{p.period_label}</p>
                <div className="mt-3 text-sm">
                  <p className="text-site-ink-soft">Target</p>
                  <p className="font-semibold text-site-moss-dark">{formatCurrency(p.target_amount)}</p>
                </div>
                <button
                  onClick={() => enroll.mutate(p.id)}
                  disabled={enroll.isPending}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-site-moss px-5 py-2.5 text-sm font-medium text-site-paper transition-colors hover:bg-site-moss-dark disabled:opacity-50"
                >
                  <Plus className="size-4" /> Daftar paket ini
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {payFor && (
        <PaymentModal
          enrollment={payFor}
          onClose={() => setPayFor(null)}
        />
      )}
    </div>
  );
}

function EnrollmentCard({
  enrollment,
  customerName,
  onPay,
}: {
  enrollment: PortalEnrollment;
  customerName: string;
  onPay: () => void;
}) {
  const target = Number(enrollment.plan.target_amount);
  const confirmed = Number(enrollment.paid_confirmed);
  const pending = Number(enrollment.paid_pending);
  const pct = Math.min(100, Math.round((confirmed / target) * 100));
  const done = confirmed >= target;

  return (
    <div className="rounded-2xl border border-site-line bg-site-paper p-5">
      <div className="flex items-start justify-between">
        <div>
          <Badge tone="primary">{SPECIES_ID[enrollment.plan.species]}</Badge>
          <h3 className="mt-2 font-serif text-xl font-semibold">{enrollment.plan.name}</h3>
        </div>
        {done && <Badge tone="success" dot>Lunas</Badge>}
      </div>

      <div className="mt-4">
        <div className="flex items-end justify-between text-sm">
          <span className="font-semibold text-site-moss-dark">{formatCurrency(confirmed)}</span>
          <span className="text-site-ink-soft">dari {formatCurrency(target)}</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-site-sand">
          <div className="h-full rounded-full bg-site-moss transition-all" style={{ width: `${pct}%` }} />
        </div>
        {pending > 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-site-clay-dark">
            <Clock className="size-3.5" /> {formatCurrency(pending)} menunggu konfirmasi
          </p>
        )}
      </div>

      {/* Payment history */}
      {enrollment.payments.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-site-line pt-3">
          {enrollment.payments.slice(0, 4).map((p) => (
            <li key={p.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-site-ink-soft">
                {p.status === 'confirmed' ? (
                  <CheckCircle2 className="size-4 text-site-moss" />
                ) : (
                  <Clock className="size-4 text-site-clay" />
                )}
                {format(new Date(p.paid_at), 'd MMM yyyy')}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-medium">{formatCurrency(p.amount)}</span>
                {p.status === 'confirmed' && (
                  <button
                    onClick={() =>
                      printReceipt({
                        receiptNo: p.id.slice(0, 8).toUpperCase(),
                        paidAt: p.paid_at,
                        customerName,
                        planName: enrollment.plan.name,
                        amount: Number(p.amount),
                        method: p.method,
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs text-site-moss-dark hover:bg-site-moss-soft"
                    aria-label="Cetak kuitansi"
                  >
                    Kuitansi
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!done && (
        <button
          onClick={onPay}
          className="mt-4 w-full rounded-full border border-site-moss/30 py-2.5 text-sm font-medium text-site-moss-dark transition-colors hover:bg-site-moss-soft"
        >
          Kirim setoran
        </button>
      )}
    </div>
  );
}

function PaymentModal({ enrollment, onClose }: { enrollment: PortalEnrollment; onClose: () => void }) {
  const submit = useSubmitPayment();
  const qc = useQueryClient();
  const [amount, setAmount] = useState(enrollment.plan.installment_amount?.toString() ?? '');
  const [method, setMethod] = useState('Transfer Bank');
  const [proof, setProof] = useState('');
  const [uploading, setUploading] = useState(false);
  const [paying, setPaying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const remaining = Math.max(0, Number(enrollment.plan.target_amount) - Number(enrollment.paid_confirmed));

  const handleProof = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadPrivateImage(file, enrollment.id);
      setProof(path);
      toast.success('Bukti terunggah');
    } catch (error) {
      toast.fromError(error, 'Gagal mengunggah bukti');
    } finally {
      setUploading(false);
    }
  };

  const numericAmount = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error('Nominal tidak valid');
      return null;
    }
    return value;
  };

  const handleManual = () => {
    const value = numericAmount();
    if (value == null) return;
    submit.mutate({ enrollmentId: enrollment.id, amount: value, method, proof }, { onSuccess: onClose });
  };

  const handleMidtrans = async () => {
    const value = numericAmount();
    if (value == null) return;
    setPaying(true);
    try {
      const outcome = await payWithMidtrans({ enrollmentId: enrollment.id, amount: value });
      await qc.invalidateQueries({ queryKey: ['portal', 'qurban'] });
      if (outcome === 'success') {
        toast.success('Terima kasih!', 'Pembayaran berhasil. Semoga qurban Anda berkah dan diterima.');
        onClose();
      } else if (outcome === 'pending') {
        toast.info('Menunggu pembayaran', 'Selesaikan sesuai instruksi. Status akan diperbarui otomatis.');
        onClose();
      } else if (outcome === 'error') {
        toast.error('Pembayaran gagal', 'Silakan coba lagi.');
      }
    } catch (error) {
      toast.fromError(error, 'Gagal memproses pembayaran');
    } finally {
      setPaying(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Kirim setoran"
      description={enrollment.plan.name}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-muted">
            Tutup
          </button>
          <button
            onClick={handleManual}
            disabled={submit.isPending}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            Catat transfer manual
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nominal (Rp)" required hint={`Sisa target: ${formatCurrency(remaining)}`}>
          <Input type="number" step="10000" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </Field>
        {enrollment.plan.installment_amount != null && (
          <p className="-mt-1 text-xs text-muted-foreground">
            Cicilan dianjurkan: <span className="font-medium text-foreground">{formatCurrency(enrollment.plan.installment_amount)}</span> per setoran.
          </p>
        )}

        {env.midtransEnabled && (
          <button
            onClick={() => void handleMidtrans()}
            disabled={paying}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {paying ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Bayar Online (Midtrans)
          </button>
        )}

        <div className="rounded-lg border border-border bg-surface-sunken p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Atau transfer manual:</p>
          <Field label="Metode">
            <Select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              options={[
                { value: 'Transfer Bank', label: 'Transfer Bank' },
                { value: 'E-wallet', label: 'E-wallet' },
                { value: 'Tunai', label: 'Tunai' },
              ]}
            />
          </Field>
          <div className="mt-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleProof(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {proof ? 'Bukti terunggah ✓' : 'Unggah bukti transfer'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
