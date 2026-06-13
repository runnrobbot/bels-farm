import { useMemo } from 'react';
import { Wheat } from 'lucide-react';
import { z } from 'zod';
import { CrudListPage } from '@/components/data/CrudListPage';
import type { Column } from '@/components/data/DataTable';
import type { FieldDef } from '@/components/data/CrudFormModal';
import { createResource } from '@/lib/crud/resource';
import { createResourceHooks } from '@/lib/crud/useResource';
import { useAnimalOptions, usePenOptions, optionMap } from '@/features/shared/options';
import { useBranches } from '@/hooks/useBranches';
import { useUiStore } from '@/stores/uiStore';
import { useAuth } from '@/features/auth/AuthProvider';
import { emptyToNull, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import type { FeedingRecordRow } from '@/types/database';

const resource = createResource('feeding_records', { searchColumns: ['feed_type'], orderBy: 'fed_at' });
const hooks = createResourceHooks(resource, { label: 'Catatan pakan' });

const schema = z
  .object({
    animal_id: z.string().uuid().optional().or(z.literal('')),
    pen_id: z.string().uuid().optional().or(z.literal('')),
    feed_type: z.string().min(2, 'Jenis pakan wajib diisi'),
    quantity: z.coerce.number().min(0, 'Jumlah tidak valid'),
    unit: z.string().min(1, 'Satuan wajib diisi'),
    cost: z.coerce.number().min(0).optional(),
    fed_at: z.string().min(1, 'Tanggal wajib diisi'),
    notes: z.string().optional().or(z.literal('')),
  })
  .refine((v) => Boolean(v.animal_id) || Boolean(v.pen_id), {
    message: 'Pilih hewan atau kandang',
    path: ['animal_id'],
  });
type Values = z.infer<typeof schema>;

export default function FeedingPage() {
  const { profile } = useAuth();
  const { data: branches = [] } = useBranches();
  const activeBranchId = useUiStore((s) => s.activeBranchId);
  const branchId = activeBranchId ?? branches[0]?.id ?? '';

  const { data: animals = [] } = useAnimalOptions();
  const { data: pens = [] } = usePenOptions();
  const animalLabels = useMemo(() => optionMap(animals), [animals]);
  const penLabels = useMemo(() => optionMap(pens), [pens]);

  const fields: FieldDef[] = useMemo(
    () => [
      { name: 'animal_id', label: 'Hewan', type: 'select', placeholder: 'Per hewan (opsional)', options: animals },
      { name: 'pen_id', label: 'Kandang', type: 'select', placeholder: 'Per kandang (opsional)', options: pens },
      { name: 'feed_type', label: 'Jenis pakan', type: 'text', required: true, placeholder: 'mis. Rumput gajah' },
      { name: 'quantity', label: 'Jumlah', type: 'number', step: '0.1', required: true },
      { name: 'unit', label: 'Satuan', type: 'text', placeholder: 'kg' },
      { name: 'cost', label: 'Biaya (Rp)', type: 'number', step: '1000' },
      { name: 'fed_at', label: 'Tanggal', type: 'date', required: true },
      { name: 'notes', label: 'Catatan', type: 'textarea' },
    ],
    [animals, pens],
  );

  const columns: Column<FeedingRecordRow>[] = [
    {
      key: 'target',
      header: 'Untuk',
      render: (r) => (
        <span className="font-medium text-foreground">
          {r.animal_id ? animalLabels.get(r.animal_id) : r.pen_id ? `Kandang ${penLabels.get(r.pen_id) ?? ''}` : '—'}
        </span>
      ),
    },
    { key: 'feed', header: 'Pakan', render: (r) => r.feed_type },
    { key: 'qty', header: 'Jumlah', align: 'right', render: (r) => `${Number(r.quantity).toLocaleString('id-ID')} ${r.unit}` },
    { key: 'fed', header: 'Tanggal', render: (r) => <span className="text-muted-foreground">{format(new Date(r.fed_at), 'd MMM yyyy')}</span> },
    { key: 'cost', header: 'Biaya', align: 'right', render: (r) => formatCurrency(r.cost) },
  ];

  return (
    <CrudListPage<'feeding_records', Values>
      hooks={hooks}
      permission="feeding"
      label="Catatan pakan"
      title="Pakan"
      description="Catat pemberian pakan per hewan atau per kandang beserta biayanya."
      icon={Wheat}
      searchPlaceholder="Cari jenis pakan…"
      columns={columns}
      fields={fields}
      schema={schema}
      formSize="xl"
      toFormValues={(r) => ({
        animal_id: r?.animal_id ?? '',
        pen_id: r?.pen_id ?? '',
        feed_type: r?.feed_type ?? '',
        quantity: r?.quantity ?? 0,
        unit: r?.unit ?? 'kg',
        cost: r?.cost ?? undefined,
        fed_at: r?.fed_at ? r.fed_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        notes: r?.notes ?? '',
      })}
      toCreate={(v) => ({ ...emptyToNull(v), branch_id: branchId, recorded_by: profile?.id ?? null })}
      toUpdate={(v) => emptyToNull(v)}
      deleteText={() => 'Catatan pakan akan diarsipkan.'}
    />
  );
}
