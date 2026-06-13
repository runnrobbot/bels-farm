import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ListChecks } from 'lucide-react';
import { z } from 'zod';
import { CrudListPage } from '@/components/data/CrudListPage';
import type { Column } from '@/components/data/DataTable';
import type { FieldDef } from '@/components/data/CrudFormModal';
import { Badge } from '@/components/ui/Badge';
import { createResource } from '@/lib/crud/resource';
import { createResourceHooks } from '@/lib/crud/useResource';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { emptyToNull } from '@/lib/utils';
import { format } from 'date-fns';
import type { TaskRow, TaskPriority, TaskStatus } from '@/types/database';

const resource = createResource('tasks', { searchColumns: ['title', 'description'] });
const hooks = createResourceHooks(resource, { label: 'Tugas' });

const CATEGORY = [
  { value: 'operational', label: 'Operasional' },
  { value: 'vaccination', label: 'Vaksinasi' },
  { value: 'feeding', label: 'Pakan' },
  { value: 'cleaning', label: 'Kebersihan' },
  { value: 'breeding', label: 'Pembiakan' },
  { value: 'pregnancy', label: 'Kebuntingan' },
];
const PRIORITY: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Rendah' },
  { value: 'medium', label: 'Sedang' },
  { value: 'high', label: 'Tinggi' },
  { value: 'urgent', label: 'Mendesak' },
];
const STATUS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To-do' },
  { value: 'in_progress', label: 'Dikerjakan' },
  { value: 'blocked', label: 'Terhambat' },
  { value: 'done', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];
const PRIORITY_TONE: Record<TaskPriority, 'neutral' | 'info' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};
const STATUS_TONE: Record<TaskStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  todo: 'neutral',
  in_progress: 'info',
  blocked: 'warning',
  done: 'success',
  cancelled: 'danger',
};

const schema = z.object({
  title: z.string().min(2, 'Judul minimal 2 karakter'),
  description: z.string().optional().or(z.literal('')),
  category: z.enum(['operational', 'vaccination', 'feeding', 'cleaning', 'breeding', 'pregnancy']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['todo', 'in_progress', 'blocked', 'done', 'cancelled']),
  assigned_to: z.string().optional().or(z.literal('')),
  due_at: z.string().optional().or(z.literal('')),
});
type Values = z.infer<typeof schema>;

const columns: Column<TaskRow>[] = [
  {
    key: 'title',
    header: 'Tugas',
    render: (t) => (
      <div>
        <p className="font-medium text-foreground">{t.title}</p>
        <p className="text-xs capitalize text-muted-foreground">
          {CATEGORY.find((c) => c.value === t.category)?.label}
        </p>
      </div>
    ),
  },
  {
    key: 'priority',
    header: 'Prioritas',
    render: (t) => <Badge tone={PRIORITY_TONE[t.priority]}>{PRIORITY.find((p) => p.value === t.priority)?.label}</Badge>,
  },
  {
    key: 'status',
    header: 'Status',
    render: (t) => <Badge tone={STATUS_TONE[t.status]} dot>{STATUS.find((s) => s.value === t.status)?.label}</Badge>,
  },
  {
    key: 'due',
    header: 'Tenggat',
    render: (t) => <span className="text-muted-foreground">{t.due_at ? format(new Date(t.due_at), 'd MMM yyyy') : '—'}</span>,
  },
];

export default function TasksPage() {
  const { profile } = useAuth();
  const { data: employees = [] } = useQuery({
    queryKey: ['employee-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name')
        .is('deleted_at', null)
        .order('full_name');
      if (error) throw toAppError(error);
      return (data ?? []).map((e) => ({ value: e.id, label: e.full_name }));
    },
    staleTime: 5 * 60_000,
  });

  const fields: FieldDef[] = useMemo(
    () => [
      { name: 'title', label: 'Judul tugas', type: 'text', required: true, full: true },
      { name: 'category', label: 'Kategori', type: 'select', options: CATEGORY },
      { name: 'priority', label: 'Prioritas', type: 'select', options: PRIORITY },
      { name: 'status', label: 'Status', type: 'select', options: STATUS },
      { name: 'assigned_to', label: 'Ditugaskan ke', type: 'select', placeholder: 'Pilih karyawan', options: employees },
      { name: 'due_at', label: 'Tenggat', type: 'date' },
      { name: 'description', label: 'Deskripsi', type: 'textarea' },
    ],
    [employees],
  );

  return (
    <CrudListPage<'tasks', Values>
      hooks={hooks}
      permission="task"
      label="Tugas"
      title="Tugas Operasional"
      description="Atur tugas vaksinasi, pakan, kebersihan, dan operasional harian."
      icon={ListChecks}
      searchPlaceholder="Cari tugas…"
      columns={columns}
      fields={fields}
      schema={schema}
      formSize="xl"
      toFormValues={(t) => ({
        title: t?.title ?? '',
        description: t?.description ?? '',
        category: t?.category ?? 'operational',
        priority: t?.priority ?? 'medium',
        status: t?.status ?? 'todo',
        assigned_to: t?.assigned_to ?? '',
        due_at: t?.due_at ? t.due_at.slice(0, 10) : '',
      })}
      toCreate={(v) =>
        ({ ...emptyToNull(v), organization_id: profile?.organization_id ?? '', created_by: profile?.id ?? null })
      }
      toUpdate={(v) => emptyToNull(v)}
      deleteText={(t) => `Tugas "${t.title}" akan diarsipkan.`}
    />
  );
}
