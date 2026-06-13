import { useState } from 'react';
import { PiggyBank, Package, Inbox, Users } from 'lucide-react';
import { z } from 'zod';
import { CrudListPage } from '@/components/data/CrudListPage';
import type { Column } from '@/components/data/DataTable';
import type { FieldDef } from '@/components/data/CrudFormModal';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { QurbanApprovals } from '@/features/qurban/Approvals';
import { QurbanParticipants } from '@/features/qurban/Participants';
import { createResource } from '@/lib/crud/resource';
import { createResourceHooks } from '@/lib/crud/useResource';
import { useAuth } from '@/features/auth/AuthProvider';
import { emptyToNull, formatCurrency, cn } from '@/lib/utils';
import type { QurbanPlanRow, Species } from '@/types/database';

const resource = createResource('qurban_plans', { searchColumns: ['name', 'period_label'] });
const hooks = createResourceHooks(resource, { label: 'Paket qurban' });

const SPECIES: { value: Species; label: string }[] = [
  { value: 'cattle', label: 'Sapi' },
  { value: 'goat', label: 'Kambing' },
  { value: 'sheep', label: 'Domba' },
];
const ACTIVE = [
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Nonaktif' },
];

const schema = z.object({
  name: z.string().min(2, 'Nama paket wajib diisi'),
  species: z.enum(['cattle', 'goat', 'sheep']),
  target_amount: z.coerce.number().min(1, 'Target wajib diisi'),
  installment_amount: z.coerce.number().min(0).optional(),
  period_label: z.string().optional().or(z.literal('')),
  starts_at: z.string().optional().or(z.literal('')),
  ends_at: z.string().optional().or(z.literal('')),
  is_active: z.enum(['true', 'false']),
});
type Values = z.infer<typeof schema>;

const fields: FieldDef[] = [
  { name: 'name', label: 'Nama paket', type: 'text', required: true, placeholder: 'mis. Qurban Sapi 1/7', full: true },
  { name: 'species', label: 'Jenis hewan', type: 'select', options: SPECIES },
  { name: 'is_active', label: 'Status', type: 'select', options: ACTIVE },
  { name: 'target_amount', label: 'Target (Rp)', type: 'number', step: '10000', required: true },
  { name: 'installment_amount', label: 'Cicilan / setoran (Rp)', type: 'number', step: '10000', hint: 'Anjuran nominal per setoran — ditampilkan sebagai default; pelanggan tetap bisa menyesuaikan.' },
  { name: 'period_label', label: 'Periode', type: 'text', placeholder: 'mis. Idul Adha 1447 H' },
  { name: 'starts_at', label: 'Mulai', type: 'date' },
  { name: 'ends_at', label: 'Selesai', type: 'date' },
];

const columns: Column<QurbanPlanRow>[] = [
  { key: 'name', header: 'Paket', render: (p) => <span className="font-medium text-foreground">{p.name}</span> },
  { key: 'species', header: 'Hewan', render: (p) => SPECIES.find((s) => s.value === p.species)?.label },
  { key: 'target', header: 'Target', align: 'right', render: (p) => formatCurrency(p.target_amount) },
  { key: 'installment', header: 'Cicilan', align: 'right', render: (p) => formatCurrency(p.installment_amount) },
  { key: 'active', header: 'Status', render: (p) => <Badge tone={p.is_active ? 'success' : 'neutral'} dot>{p.is_active ? 'Aktif' : 'Nonaktif'}</Badge> },
];

function PlansTab() {
  const { profile } = useAuth();

  return (
    <CrudListPage<'qurban_plans', Values>
      hooks={hooks}
      permission="qurban"
      label="Paket qurban"
      title="Tabungan Qurban"
      description="Kelola paket tabungan qurban yang tampil di website publik."
      icon={PiggyBank}
      searchPlaceholder="Cari paket…"
      columns={columns}
      fields={fields}
      schema={schema}
      formSize="xl"
      toFormValues={(p) => ({
        name: p?.name ?? '',
        species: p?.species ?? 'cattle',
        target_amount: p?.target_amount ?? 0,
        installment_amount: p?.installment_amount ?? undefined,
        period_label: p?.period_label ?? '',
        starts_at: p?.starts_at ?? '',
        ends_at: p?.ends_at ?? '',
        is_active: p?.is_active === false ? 'false' : 'true',
      })}
      toCreate={(v) => {
        const { is_active, ...rest } = emptyToNull(v);
        return { ...rest, is_active: is_active === 'true', organization_id: profile?.organization_id ?? '' };
      }}
      toUpdate={(v) => {
        const { is_active, ...rest } = emptyToNull(v);
        return { ...rest, is_active: is_active === 'true' };
      }}
      deleteText={(p) => `Paket "${p.name}" akan diarsipkan.`}
    />
  );
}

type Tab = 'plans' | 'participants' | 'approvals';
const TABS: { key: Tab; label: string; icon: typeof Package }[] = [
  { key: 'plans', label: 'Paket', icon: Package },
  { key: 'participants', label: 'Peserta', icon: Users },
  { key: 'approvals', label: 'Persetujuan Setoran', icon: Inbox },
];

export default function QurbanPage() {
  const [tab, setTab] = useState<Tab>('plans');

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1.5 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'plans' ? (
        <PlansTab />
      ) : tab === 'participants' ? (
        <div>
          <PageHeader title="Peserta Tabungan Qurban" description="Daftar peserta, paket yang diikuti, dan progres setorannya." />
          <QurbanParticipants />
        </div>
      ) : (
        <div>
          <PageHeader title="Persetujuan Setoran" description="Konfirmasi atau tolak setoran tabungan qurban dari pelanggan." />
          <QurbanApprovals />
        </div>
      )}
    </div>
  );
}
