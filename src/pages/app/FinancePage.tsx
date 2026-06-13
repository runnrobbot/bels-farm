import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { z } from 'zod';
import { CrudListPage } from '@/components/data/CrudListPage';
import type { Column } from '@/components/data/DataTable';
import type { FieldDef } from '@/components/data/CrudFormModal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { createResource } from '@/lib/crud/resource';
import { createResourceHooks } from '@/lib/crud/useResource';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { emptyToNull, formatCurrency } from '@/lib/utils';
import { format, startOfMonth } from 'date-fns';
import type { FinanceTransactionRow, FinanceKind } from '@/types/database';

const resource = createResource('finance_transactions', { searchColumns: ['description', 'reference'] });
const hooks = createResourceHooks(resource, { label: 'Transaksi' });

const KIND: { value: FinanceKind; label: string }[] = [
  { value: 'income', label: 'Pemasukan' },
  { value: 'expense', label: 'Pengeluaran' },
];

const schema = z.object({
  kind: z.enum(['income', 'expense']),
  amount: z.coerce.number().min(0, 'Nominal tidak valid'),
  description: z.string().min(2, 'Deskripsi wajib diisi'),
  category_id: z.string().optional().or(z.literal('')),
  occurred_at: z.string().min(1, 'Tanggal wajib diisi'),
  reference: z.string().optional().or(z.literal('')),
});
type Values = z.infer<typeof schema>;

const columns: Column<FinanceTransactionRow>[] = [
  {
    key: 'desc',
    header: 'Deskripsi',
    render: (t) => (
      <div>
        <p className="font-medium text-foreground">{t.description}</p>
        <p className="text-xs text-muted-foreground">{format(new Date(t.occurred_at), 'd MMM yyyy')}</p>
      </div>
    ),
  },
  {
    key: 'kind',
    header: 'Jenis',
    render: (t) => (
      <Badge tone={t.kind === 'income' ? 'success' : 'danger'} dot>
        {t.kind === 'income' ? 'Masuk' : 'Keluar'}
      </Badge>
    ),
  },
  {
    key: 'amount',
    header: 'Nominal',
    align: 'right',
    render: (t) => (
      <span className={`font-semibold tabular-nums ${t.kind === 'income' ? 'text-success' : 'text-danger'}`}>
        {t.kind === 'income' ? '+' : '−'}
        {formatCurrency(t.amount)}
      </span>
    ),
  },
];

function SummaryCards() {
  const { data } = useQuery({
    queryKey: ['finance', 'summary-month'],
    queryFn: async () => {
      const since = startOfMonth(new Date()).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('finance_transactions')
        .select('kind, amount')
        .gte('occurred_at', since)
        .is('deleted_at', null);
      if (error) throw toAppError(error);
      let income = 0;
      let expense = 0;
      for (const row of data ?? []) {
        if (row.kind === 'income') income += Number(row.amount);
        else expense += Number(row.amount);
      }
      return { income, expense, profit: income - expense };
    },
  });

  const items = [
    { label: 'Pemasukan (bln ini)', value: data?.income ?? 0, icon: TrendingUp, tone: 'text-success' },
    { label: 'Pengeluaran (bln ini)', value: data?.expense ?? 0, icon: TrendingDown, tone: 'text-danger' },
    { label: 'Laba bersih', value: data?.profit ?? 0, icon: Wallet, tone: 'text-primary' },
  ];

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {items.map((it) => (
        <Card key={it.label} className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{it.label}</p>
            <p className={`mt-1 font-display text-xl font-semibold tabular-nums ${it.tone}`}>
              {formatCurrency(it.value)}
            </p>
          </div>
          <it.icon className={`size-6 ${it.tone}`} />
        </Card>
      ))}
    </div>
  );
}

export default function FinancePage() {
  const { profile } = useAuth();
  const { data: categories = [] } = useQuery({
    queryKey: ['finance', 'categories-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_categories')
        .select('id, name, kind')
        .is('deleted_at', null)
        .order('name');
      if (error) throw toAppError(error);
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const fields: FieldDef[] = useMemo(
    () => [
      { name: 'kind', label: 'Jenis', type: 'select', options: KIND },
      { name: 'amount', label: 'Nominal (Rp)', type: 'number', step: '1000', required: true },
      { name: 'description', label: 'Deskripsi', type: 'text', required: true, full: true },
      {
        name: 'category_id',
        label: 'Kategori',
        type: 'select',
        placeholder: 'Pilih kategori',
        options: categories.map((c) => ({ value: c.id, label: c.name })),
      },
      { name: 'occurred_at', label: 'Tanggal', type: 'date', required: true },
      { name: 'reference', label: 'Referensi', type: 'text', placeholder: 'No. nota / invoice' },
    ],
    [categories],
  );

  return (
    <CrudListPage<'finance_transactions', Values>
      hooks={hooks}
      permission="finance"
      label="Transaksi"
      title="Keuangan"
      description="Catat pemasukan dan pengeluaran, pantau arus kas dan laba."
      icon={Wallet}
      searchPlaceholder="Cari deskripsi atau referensi…"
      columns={columns}
      fields={fields}
      schema={schema}
      formSize="xl"
      beforeContent={<SummaryCards />}
      toFormValues={(t) => ({
        kind: t?.kind ?? 'expense',
        amount: t?.amount ?? 0,
        description: t?.description ?? '',
        category_id: t?.category_id ?? '',
        occurred_at: t?.occurred_at ?? new Date().toISOString().slice(0, 10),
        reference: t?.reference ?? '',
      })}
      toCreate={(v) => ({
        ...emptyToNull(v),
        organization_id: profile?.organization_id ?? '',
        recorded_by: profile?.id ?? null,
        currency: 'IDR',
      })}
      toUpdate={(v) => emptyToNull(v)}
      deleteText={(t) => `Transaksi "${t.description}" akan diarsipkan.`}
    />
  );
}
