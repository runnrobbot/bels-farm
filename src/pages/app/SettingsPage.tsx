import { useState } from 'react';
import { Layers, Building2, Users as UsersIcon, ShieldCheck } from 'lucide-react';
import { CrudListPage } from '@/components/data/CrudListPage';
import type { Column } from '@/components/data/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/AuthProvider';
import { emptyToNull } from '@/lib/utils';
import {
  divisionsHooks,
  divisionSchema,
  type DivisionValues,
  branchesHooks,
  branchSchema,
  type BranchValues,
} from '@/features/settings/api';
import { UsersPanel } from '@/features/settings/UsersPanel';
import { RolesPanel } from '@/features/settings/RolesPanel';
import type { DivisionRow, BranchRow } from '@/types/database';

type Tab = 'divisions' | 'branches' | 'users' | 'roles';
const TABS: { key: Tab; label: string; icon: typeof Layers }[] = [
  { key: 'divisions', label: 'Divisi', icon: Layers },
  { key: 'branches', label: 'Cabang', icon: Building2 },
  { key: 'users', label: 'Pengguna', icon: UsersIcon },
  { key: 'roles', label: 'Peran & Akses', icon: ShieldCheck },
];

const divisionColumns: Column<DivisionRow>[] = [
  {
    key: 'name',
    header: 'Divisi',
    render: (d) => (
      <span className="flex items-center gap-2.5">
        <span className="size-3 rounded-full" style={{ backgroundColor: d.color }} />
        <span className="font-medium text-foreground">{d.name}</span>
      </span>
    ),
  },
  { key: 'desc', header: 'Deskripsi', render: (d) => <span className="text-muted-foreground">{d.description || '—'}</span> },
];

const branchColumns: Column<BranchRow>[] = [
  { key: 'name', header: 'Cabang', render: (b) => <span className="font-medium text-foreground">{b.name}</span> },
  { key: 'code', header: 'Kode', render: (b) => <span className="font-mono text-muted-foreground">{b.code}</span> },
  { key: 'address', header: 'Alamat', render: (b) => <span className="text-muted-foreground">{b.address || '—'}</span> },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('divisions');
  const { profile } = useAuth();
  const orgId = profile?.organization_id ?? '';

  return (
    <div>
      <PageHeader title="Pengaturan" description="Kelola divisi, cabang, pengguna, peran, dan hak akses." />

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

      {tab === 'divisions' && (
        <CrudListPage<'divisions', DivisionValues>
          hooks={divisionsHooks}
          permission="settings"
          label="Divisi"
          title="Divisi"
          description="Buat divisi dinamis seperti Pembiakan, Pakan, Kesehatan."
          icon={Layers}
          searchable={false}
          columns={divisionColumns}
          schema={divisionSchema}
          fields={[
            { name: 'name', label: 'Nama divisi', type: 'text', required: true },
            { name: 'color', label: 'Warna (hex)', type: 'text', placeholder: '#3f6f4e' },
            { name: 'description', label: 'Deskripsi', type: 'textarea' },
          ]}
          toFormValues={(d) => ({ name: d?.name ?? '', color: d?.color ?? '#3f6f4e', description: d?.description ?? '' })}
          toCreate={(v) => ({ ...emptyToNull(v), color: v.color || '#3f6f4e', organization_id: orgId })}
          toUpdate={(v) => emptyToNull(v)}
          deleteText={(d) => `Divisi "${d.name}" akan diarsipkan.`}
        />
      )}

      {tab === 'branches' && (
        <CrudListPage<'branches', BranchValues>
          hooks={branchesHooks}
          permission="settings"
          label="Cabang"
          title="Cabang"
          description="Kelola lokasi peternakan / cabang."
          icon={Building2}
          searchable={false}
          columns={branchColumns}
          schema={branchSchema}
          fields={[
            { name: 'name', label: 'Nama cabang', type: 'text', required: true },
            { name: 'code', label: 'Kode', type: 'text', required: true, placeholder: 'HQ' },
            { name: 'timezone', label: 'Zona waktu', type: 'text', placeholder: 'Asia/Jakarta' },
            { name: 'address', label: 'Alamat', type: 'textarea' },
          ]}
          toFormValues={(b) => ({
            name: b?.name ?? '',
            code: b?.code ?? '',
            timezone: b?.timezone ?? 'Asia/Jakarta',
            address: b?.address ?? '',
          })}
          toCreate={(v) => ({
            ...emptyToNull(v),
            timezone: v.timezone || 'Asia/Jakarta',
            is_active: true,
            organization_id: orgId,
          })}
          toUpdate={(v) => emptyToNull(v)}
          deleteText={(b) => `Cabang "${b.name}" akan diarsipkan.`}
        />
      )}

      {tab === 'users' && <UsersPanel />}
      {tab === 'roles' && <RolesPanel />}
    </div>
  );
}
