import { useMemo } from 'react';
import { Baby } from 'lucide-react';
import { z } from 'zod';
import { CrudListPage } from '@/components/data/CrudListPage';
import type { Column } from '@/components/data/DataTable';
import type { FieldDef } from '@/components/data/CrudFormModal';
import { Badge } from '@/components/ui/Badge';
import { createResource } from '@/lib/crud/resource';
import { createResourceHooks } from '@/lib/crud/useResource';
import { useAnimalOptions, optionMap } from '@/features/shared/options';
import { useAuth } from '@/features/auth/AuthProvider';
import { emptyToNull } from '@/lib/utils';
import { format } from 'date-fns';
import type { BreedingRecordRow, BreedingResult } from '@/types/database';

const resource = createResource('breeding_records', { searchColumns: ['notes'], orderBy: 'mated_at' });
const hooks = createResourceHooks(resource, { label: 'Catatan pembiakan' });

const RESULT: { value: BreedingResult; label: string }[] = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'pregnant', label: 'Bunting' },
  { value: 'not_pregnant', label: 'Tidak bunting' },
  { value: 'birthed', label: 'Melahirkan' },
  { value: 'aborted', label: 'Keguguran' },
];
const RESULT_TONE: Record<BreedingResult, 'neutral' | 'success' | 'warning' | 'info' | 'danger'> = {
  pending: 'neutral',
  pregnant: 'success',
  not_pregnant: 'warning',
  birthed: 'info',
  aborted: 'danger',
};

const schema = z.object({
  dam_id: z.string().uuid('Pilih induk betina'),
  sire_id: z.string().uuid().optional().or(z.literal('')),
  method: z.enum(['natural', 'artificial']).optional().or(z.literal('')),
  mated_at: z.string().min(1, 'Tanggal wajib diisi'),
  expected_due_at: z.string().optional().or(z.literal('')),
  result: z.enum(['pending', 'pregnant', 'not_pregnant', 'birthed', 'aborted']),
  notes: z.string().optional().or(z.literal('')),
});
type Values = z.infer<typeof schema>;

export default function BreedingPage() {
  const { profile } = useAuth();
  const { data: females = [] } = useAnimalOptions({ sex: 'female' });
  const { data: males = [] } = useAnimalOptions({ sex: 'male' });
  const { data: allAnimals = [] } = useAnimalOptions();
  const labels = useMemo(() => optionMap(allAnimals), [allAnimals]);

  const fields: FieldDef[] = useMemo(
    () => [
      { name: 'dam_id', label: 'Induk betina', type: 'select', required: true, placeholder: 'Pilih betina', options: females },
      { name: 'sire_id', label: 'Pejantan', type: 'select', placeholder: 'Pilih pejantan (opsional)', options: males },
      {
        name: 'method',
        label: 'Metode',
        type: 'select',
        placeholder: 'Pilih metode',
        options: [
          { value: 'natural', label: 'Alami' },
          { value: 'artificial', label: 'Inseminasi buatan' },
        ],
      },
      { name: 'result', label: 'Hasil', type: 'select', options: RESULT },
      { name: 'mated_at', label: 'Tanggal kawin', type: 'date', required: true },
      { name: 'expected_due_at', label: 'Perkiraan lahir', type: 'date', hint: 'Untuk pengingat' },
      { name: 'notes', label: 'Catatan', type: 'textarea' },
    ],
    [females, males],
  );

  const columns: Column<BreedingRecordRow>[] = [
    { key: 'dam', header: 'Induk', render: (r) => <span className="font-medium text-foreground">{labels.get(r.dam_id) ?? '—'}</span> },
    { key: 'sire', header: 'Pejantan', render: (r) => <span className="text-muted-foreground">{r.sire_id ? labels.get(r.sire_id) ?? '—' : '—'}</span> },
    { key: 'mated', header: 'Kawin', render: (r) => format(new Date(r.mated_at), 'd MMM yyyy') },
    {
      key: 'due',
      header: 'Perkiraan lahir',
      render: (r) => (r.expected_due_at ? <Badge tone="warning">{format(new Date(r.expected_due_at), 'd MMM yyyy')}</Badge> : <span className="text-muted-foreground">—</span>),
    },
    { key: 'result', header: 'Hasil', render: (r) => <Badge tone={RESULT_TONE[r.result]} dot>{RESULT.find((x) => x.value === r.result)?.label}</Badge> },
  ];

  return (
    <CrudListPage<'breeding_records', Values>
      hooks={hooks}
      permission="breeding"
      label="Catatan pembiakan"
      title="Pembiakan"
      description="Catat perkawinan, kebuntingan, dan perkiraan kelahiran."
      icon={Baby}
      searchable={false}
      columns={columns}
      fields={fields}
      schema={schema}
      formSize="xl"
      toFormValues={(r) => ({
        dam_id: r?.dam_id ?? '',
        sire_id: r?.sire_id ?? '',
        method: r?.method ?? '',
        mated_at: r?.mated_at ?? new Date().toISOString().slice(0, 10),
        expected_due_at: r?.expected_due_at ?? '',
        result: r?.result ?? 'pending',
        notes: r?.notes ?? '',
      })}
      toCreate={(v) => ({ ...emptyToNull(v), method: v.method || null, offspring_count: 0, recorded_by: profile?.id ?? null })}
      toUpdate={(v) => ({ ...emptyToNull(v), method: v.method || null })}
      deleteText={() => 'Catatan pembiakan akan diarsipkan.'}
    />
  );
}
