import { useMemo } from 'react';
import { HeartPulse } from 'lucide-react';
import { z } from 'zod';
import { CrudListPage } from '@/components/data/CrudListPage';
import type { Column } from '@/components/data/DataTable';
import type { FieldDef } from '@/components/data/CrudFormModal';
import { Badge } from '@/components/ui/Badge';
import { createResource } from '@/lib/crud/resource';
import { createResourceHooks } from '@/lib/crud/useResource';
import { useAnimalOptions, optionMap } from '@/features/shared/options';
import { useAuth } from '@/features/auth/AuthProvider';
import { emptyToNull, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import type { HealthRecordRow } from '@/types/database';

const resource = createResource('health_records', { searchColumns: ['title', 'medicine', 'veterinarian'] });
const hooks = createResourceHooks(resource, { label: 'Catatan kesehatan' });

const KIND = [
  { value: 'vaccination', label: 'Vaksinasi' },
  { value: 'treatment', label: 'Pengobatan' },
  { value: 'disease', label: 'Penyakit' },
  { value: 'checkup', label: 'Pemeriksaan' },
  { value: 'note', label: 'Catatan' },
];
const KIND_TONE: Record<string, 'primary' | 'info' | 'danger' | 'success' | 'neutral'> = {
  vaccination: 'primary',
  treatment: 'info',
  disease: 'danger',
  checkup: 'success',
  note: 'neutral',
};

const schema = z.object({
  animal_id: z.string().uuid('Pilih hewan'),
  kind: z.enum(['vaccination', 'treatment', 'disease', 'checkup', 'note']),
  title: z.string().min(2, 'Judul wajib diisi'),
  medicine: z.string().optional().or(z.literal('')),
  dosage: z.string().optional().or(z.literal('')),
  veterinarian: z.string().optional().or(z.literal('')),
  cost: z.coerce.number().min(0).optional(),
  performed_at: z.string().min(1, 'Tanggal wajib diisi'),
  next_due_at: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});
type Values = z.infer<typeof schema>;

export default function HealthPage() {
  const { profile } = useAuth();
  const { data: animals = [] } = useAnimalOptions();
  const animalLabels = useMemo(() => optionMap(animals), [animals]);

  const fields: FieldDef[] = useMemo(
    () => [
      { name: 'animal_id', label: 'Hewan', type: 'select', required: true, placeholder: 'Pilih hewan', options: animals },
      { name: 'kind', label: 'Jenis', type: 'select', options: KIND },
      { name: 'title', label: 'Judul', type: 'text', required: true, placeholder: 'mis. Vaksin SE', full: true },
      { name: 'medicine', label: 'Obat / vaksin', type: 'text' },
      { name: 'dosage', label: 'Dosis', type: 'text' },
      { name: 'veterinarian', label: 'Dokter hewan', type: 'text' },
      { name: 'cost', label: 'Biaya (Rp)', type: 'number', step: '1000' },
      { name: 'performed_at', label: 'Tanggal tindakan', type: 'date', required: true },
      { name: 'next_due_at', label: 'Jadwal berikutnya', type: 'date', hint: 'Untuk pengingat' },
      { name: 'notes', label: 'Catatan', type: 'textarea' },
    ],
    [animals],
  );

  const columns: Column<HealthRecordRow>[] = [
    {
      key: 'animal',
      header: 'Hewan',
      render: (r) => <span className="font-medium text-foreground">{animalLabels.get(r.animal_id) ?? '—'}</span>,
    },
    { key: 'kind', header: 'Jenis', render: (r) => <Badge tone={KIND_TONE[r.kind]}>{KIND.find((k) => k.value === r.kind)?.label}</Badge> },
    { key: 'title', header: 'Tindakan', render: (r) => r.title },
    { key: 'performed', header: 'Tanggal', render: (r) => <span className="text-muted-foreground">{format(new Date(r.performed_at), 'd MMM yyyy')}</span> },
    {
      key: 'next',
      header: 'Berikutnya',
      render: (r) =>
        r.next_due_at ? (
          <Badge tone="warning">{format(new Date(r.next_due_at), 'd MMM yyyy')}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    { key: 'cost', header: 'Biaya', align: 'right', render: (r) => formatCurrency(r.cost) },
  ];

  return (
    <CrudListPage<'health_records', Values>
      hooks={hooks}
      permission="health"
      label="Catatan kesehatan"
      title="Kesehatan Ternak"
      description="Vaksinasi, pengobatan, penyakit, dan jadwal pengingat."
      icon={HeartPulse}
      searchPlaceholder="Cari tindakan, obat, dokter…"
      columns={columns}
      fields={fields}
      schema={schema}
      formSize="xl"
      toFormValues={(r) => ({
        animal_id: r?.animal_id ?? '',
        kind: r?.kind ?? 'vaccination',
        title: r?.title ?? '',
        medicine: r?.medicine ?? '',
        dosage: r?.dosage ?? '',
        veterinarian: r?.veterinarian ?? '',
        cost: r?.cost ?? undefined,
        performed_at: r?.performed_at ?? new Date().toISOString().slice(0, 10),
        next_due_at: r?.next_due_at ?? '',
        notes: r?.notes ?? '',
      })}
      toCreate={(v) => ({ ...emptyToNull(v), recorded_by: profile?.id ?? null })}
      toUpdate={(v) => emptyToNull(v)}
      deleteText={(r) => `Catatan "${r.title}" akan diarsipkan.`}
    />
  );
}
