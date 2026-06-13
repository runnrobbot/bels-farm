import { useState } from 'react';
import { Beef, Contact, Wallet, Boxes, Download, FileSpreadsheet, Printer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { toCsv, downloadCsv, type CsvColumn } from '@/lib/csv';
import { castAs } from '@/lib/utils';
import { toast } from '@/stores/toastStore';
import { usePermission } from '@/features/auth/hooks/usePermission';
import { format } from 'date-fns';
import type { Resource } from '@/features/auth/types';

interface ReportDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  permission: Resource;
  run: () => Promise<{ rows: Record<string, unknown>[]; columns: CsvColumn<Record<string, unknown>>[] }>;
}

async function fetchAll(table: string, select: string, order: string): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from(table as 'animals')
    .select(select)
    .is('deleted_at', null)
    .order(order, { ascending: false })
    .limit(5000);
  if (error) throw toAppError(error);
  return castAs<Record<string, unknown>[]>(data ?? []);
}

const REPORTS: ReportDef[] = [
  {
    id: 'livestock',
    title: 'Data Ternak',
    description: 'Seluruh ternak: ear tag, jenis, status, bobot.',
    icon: Beef,
    permission: 'livestock',
    run: async () => {
      const rows = await fetchAll('animals', 'ear_tag, name, species, sex, status, current_weight_kg, created_at', 'created_at');
      const columns: CsvColumn<Record<string, unknown>>[] = [
        { header: 'Ear Tag', value: (r) => r.ear_tag },
        { header: 'Nama', value: (r) => r.name },
        { header: 'Jenis', value: (r) => r.species },
        { header: 'Kelamin', value: (r) => r.sex },
        { header: 'Status', value: (r) => r.status },
        { header: 'Bobot (kg)', value: (r) => r.current_weight_kg },
      ];
      return { rows, columns };
    },
  },
  {
    id: 'customers',
    title: 'Data Pelanggan',
    description: 'Daftar pelanggan beserta kontak.',
    icon: Contact,
    permission: 'customer',
    run: async () => {
      const rows = await fetchAll('customers', 'full_name, whatsapp, phone, email, city, created_at', 'created_at');
      const columns: CsvColumn<Record<string, unknown>>[] = [
        { header: 'Nama', value: (r) => r.full_name },
        { header: 'WhatsApp', value: (r) => r.whatsapp },
        { header: 'Telepon', value: (r) => r.phone },
        { header: 'Email', value: (r) => r.email },
        { header: 'Kota', value: (r) => r.city },
      ];
      return { rows, columns };
    },
  },
  {
    id: 'finance',
    title: 'Transaksi Keuangan',
    description: 'Pemasukan & pengeluaran tercatat.',
    icon: Wallet,
    permission: 'finance',
    run: async () => {
      const rows = await fetchAll('finance_transactions', 'occurred_at, kind, amount, description, reference', 'occurred_at');
      const columns: CsvColumn<Record<string, unknown>>[] = [
        { header: 'Tanggal', value: (r) => r.occurred_at },
        { header: 'Jenis', value: (r) => r.kind },
        { header: 'Nominal', value: (r) => r.amount },
        { header: 'Deskripsi', value: (r) => r.description },
        { header: 'Referensi', value: (r) => r.reference },
      ];
      return { rows, columns };
    },
  },
  {
    id: 'inventory',
    title: 'Stok Inventaris',
    description: 'Pakan, obat, dan peralatan.',
    icon: Boxes,
    permission: 'inventory',
    run: async () => {
      const rows = await fetchAll('inventory_items', 'name, category, quantity, unit, min_quantity, unit_cost', 'name');
      const columns: CsvColumn<Record<string, unknown>>[] = [
        { header: 'Nama', value: (r) => r.name },
        { header: 'Kategori', value: (r) => r.category },
        { header: 'Stok', value: (r) => r.quantity },
        { header: 'Satuan', value: (r) => r.unit },
        { header: 'Stok Min', value: (r) => r.min_quantity },
        { header: 'Harga/satuan', value: (r) => r.unit_cost },
      ];
      return { rows, columns };
    },
  },
];

export default function ReportsPage() {
  const { can } = usePermission();
  const [busy, setBusy] = useState<string | null>(null);

  const handleExport = async (report: ReportDef) => {
    setBusy(report.id);
    try {
      const { rows, columns } = await report.run();
      if (rows.length === 0) {
        toast.info('Tidak ada data', `Belum ada data untuk ${report.title}.`);
        return;
      }
      const csv = toCsv(rows, columns);
      downloadCsv(`${report.id}-${format(new Date(), 'yyyy-MM-dd')}`, csv);
      toast.success('Laporan diunduh', `${rows.length} baris diekspor.`);
    } catch (error) {
      toast.fromError(error, 'Gagal mengekspor');
    } finally {
      setBusy(null);
    }
  };

  const available = REPORTS.filter((r) => can(r.permission, 'export') || can(r.permission, 'view'));

  return (
    <div>
      <PageHeader
        title="Laporan"
        description="Ekspor data ke CSV (kompatibel Excel) atau cetak ke PDF."
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" /> Cetak / PDF
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {available.map((report) => (
          <Card key={report.id} className="flex flex-col">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary-muted text-primary">
              <report.icon className="size-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-foreground">{report.title}</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{report.description}</p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              loading={busy === report.id}
              onClick={() => handleExport(report)}
            >
              {busy === report.id ? <FileSpreadsheet className="size-4" /> : <Download className="size-4" />}
              Ekspor CSV
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
