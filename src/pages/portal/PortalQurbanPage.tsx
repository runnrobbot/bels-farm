import { useEffect, useRef, useState } from 'react';
import { PiggyBank, Plus, CheckCircle2, Clock, Upload, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
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
import { toast } from '@/stores/toastStore';
import { formatCurrency } from '@/lib/utils';
import { SPECIES_ID } from '@/features/marketing/species';
import { format } from 'date-fns';

const BCA_ACCOUNT = 'BCA 7615311201\nAN MUHAMAD LABIB AZHAR';

export default function PortalQurbanPage() {
  const { profile, session } = useAuth();
  const qc = useQueryClient();
  const { data: overview, isLoading } = usePortalOverview();
  const { data: plans = [] } = usePublicQurbanPlans();
  const enroll = useEnroll();
  const ensured = useRef(false);

  const [payFor, setPayFor] = useState<PortalEnrollment | null>(null);

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
  onPay,
}: {
  enrollment: PortalEnrollment;
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
              <span className="font-medium">{formatCurrency(p.amount)}</span>
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
  const [amount, setAmount] = useState(enrollment.plan.installment_amount?.toString() ?? '');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const remaining = Math.max(0, Number(enrollment.plan.target_amount) - Number(enrollment.paid_confirmed));

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

  const handleSubmit = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error('Nominal tidak valid');
      return;
    }
    if (!proofFile) {
      toast.error('Wajib upload bukti transfer');
      return;
    }
    setUploading(true);
    submit.mutate(
      { enrollmentId: enrollment.id, amount: value, method: 'Transfer Bank BCA', proofFile },
      {
        onSuccess: () => {
          setProofPreview(null);
          setProofFile(null);
          onClose();
        },
        onError: () => setUploading(false),
      },
    );
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
            onClick={handleSubmit}
            disabled={submit.isPending || uploading}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submit.isPending || uploading ? <Loader2 className="size-4 animate-spin" /> : null}
            Kirim & Konfirmasi
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nominal (Rp)" required hint={`Sisa target: ${formatCurrency(remaining)}`}>
          <Input type="number" step="10000" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </Field>

        {/* BCA Account */}
        <div className="rounded-xl border-2 border-site-moss/40 bg-site-moss-soft/50 p-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-site-moss-dark">Transfer ke rekening</p>
          <p className="whitespace-pre-line font-mono text-sm font-semibold text-site-ink">{BCA_ACCOUNT}</p>
        </div>

        {/* Proof upload */}
        <Field label="Bukti Transfer" required>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-lg border border-dashed border-site-line bg-site-paper px-4 py-3 text-sm text-site-ink-soft transition-colors hover:border-site-moss hover:text-site-ink"
          >
            <Upload className="size-5 text-site-moss" />
            {proofFile ? proofFile.name : 'Klik untuk upload screenshot bukti transfer'}
          </button>
          {proofPreview && (
            <div className="mt-2 overflow-hidden rounded-lg border border-site-line">
              <img src={proofPreview} alt="Preview bukti transfer" className="max-h-48 w-full object-contain bg-site-sand" />
            </div>
          )}
        </Field>

        {enrollment.plan.installment_amount != null && (
          <p className="-mt-1 text-xs text-site-ink-soft">
            Anjuran cicilan: <span className="font-medium text-site-ink">{formatCurrency(enrollment.plan.installment_amount)}</span>
          </p>
        )}
      </div>
    </Modal>
  );
}
