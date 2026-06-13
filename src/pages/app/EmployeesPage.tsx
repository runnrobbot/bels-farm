import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { z } from 'zod';
import { CrudListPage } from '@/components/data/CrudListPage';
import type { Column } from '@/components/data/DataTable';
import type { FieldDef } from '@/components/data/CrudFormModal';
import { Badge } from '@/components/ui/Badge';
import { createResource } from '@/lib/crud/resource';
import { createResourceHooks } from '@/lib/crud/useResource';
import { useDivisionOptions } from '@/features/settings/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { emptyToNull, formatCurrency } from '@/lib/utils';
import type { EmployeeRow, EmployeeStatus } from '@/types/database';

const resource = createResource('employees', {
  searchColumns: ['full_name', 'employee_code', 'position', 'phone'],
});
const hooks = createResourceHooks(resource, { label: 'Karyawan' });

const STATUS: { value: EmployeeStatus; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'on_leave', label: 'Cuti' },
  { value: 'suspended', label: 'Ditangguhkan' },
  { value: 'terminated', label: 'Berhenti' },
];
const STATUS_TONE: Record<EmployeeStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  active: 'success',
  on_leave: 'warning',
  suspended: 'danger',
  terminated: 'neutral',
};

const schema = z.object({
  employee_code: z.string().min(1, 'Wajib diisi'),
  full_name: z.string().min(2, 'Nama minimal 2 karakter'),
  position: z.string().optional().or(z.literal('')),
  division_id: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  salary: z.coerce.number().min(0).optional(),
  status: z.enum(['active', 'on_leave', 'suspended', 'terminated']),
  hired_at: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});
type Values = z.infer<typeof schema>;

const columns: Column<EmployeeRow>[] = [
  {
    key: 'name',
    header: 'Karyawan',
    render: (e) => (
      <div>
        <p className="font-medium text-foreground">{e.full_name}</p>
        <p className="font-mono text-xs text-muted-foreground">{e.employee_code}</p>
      </div>
    ),
  },
  { key: 'position', header: 'Posisi', render: (e) => e.position || '—' },
  { key: 'salary', header: 'Gaji', align: 'right', render: (e) => formatCurrency(e.salary) },
  {
    key: 'status',
    header: 'Status',
    render: (e) => <Badge tone={STATUS_TONE[e.status]} dot>{STATUS.find((s) => s.value === e.status)?.label}</Badge>,
  },
];

export default function EmployeesPage() {
  const { profile } = useAuth();
  const { data: divisions = [] } = useDivisionOptions();

  const fields: FieldDef[] = useMemo(
    () => [
      { name: 'employee_code', label: 'Kode karyawan', type: 'text', required: true, placeholder: 'EMP-001' },
      { name: 'full_name', label: 'Nama lengkap', type: 'text', required: true },
      { name: 'position', label: 'Posisi', type: 'text', placeholder: 'mis. Perawat ternak' },
      { name: 'division_id', label: 'Divisi', type: 'select', placeholder: 'Pilih divisi', options: divisions },
      { name: 'phone', label: 'Telepon', type: 'text' },
      { name: 'salary', label: 'Gaji (Rp)', type: 'number', step: '1000' },
      { name: 'status', label: 'Status', type: 'select', options: STATUS },
      { name: 'hired_at', label: 'Tanggal masuk', type: 'date' },
      { name: 'address', label: 'Alamat', type: 'textarea' },
    ],
    [divisions],
  );

  return (
    <CrudListPage<'employees', Values>
      hooks={hooks}
      permission="employee"
      label="Karyawan"
      title="Karyawan"
      description="Kelola profil karyawan, divisi, dan status kepegawaian."
      icon={Users}
      searchPlaceholder="Cari nama, kode, posisi…"
      columns={columns}
      fields={fields}
      schema={schema}
      formSize="xl"
      toFormValues={(e) => ({
        employee_code: e?.employee_code ?? '',
        full_name: e?.full_name ?? '',
        position: e?.position ?? '',
        division_id: e?.division_id ?? '',
        phone: e?.phone ?? '',
        salary: e?.salary ?? undefined,
        status: e?.status ?? 'active',
        hired_at: e?.hired_at ?? '',
        address: e?.address ?? '',
      })}
      toCreate={(v) =>
        ({ ...emptyToNull(v), organization_id: profile?.organization_id ?? '' })
      }
      toUpdate={(v) => emptyToNull(v)}
      deleteText={(e) => `"${e.full_name}" akan diarsipkan dan dapat dipulihkan.`}
    />
  );
}
