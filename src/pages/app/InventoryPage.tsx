import { useState } from 'react';
import { Boxes, ArrowLeftRight } from 'lucide-react';
import { z } from 'zod';
import { CrudListPage } from '@/components/data/CrudListPage';
import type { Column } from '@/components/data/DataTable';
import type { FieldDef } from '@/components/data/CrudFormModal';
import { Badge } from '@/components/ui/Badge';
import { createResource } from '@/lib/crud/resource';
import { createResourceHooks } from '@/lib/crud/useResource';
import { usePermission } from '@/features/auth/hooks/usePermission';
import { StockMoveModal } from '@/features/inventory/StockMoveModal';
import { useBranches } from '@/hooks/useBranches';
import { useUiStore } from '@/stores/uiStore';
import { emptyToNull, formatCurrency } from '@/lib/utils';
import type { InventoryItemRow, InsertDto, UpdateDto } from '@/types/database';

const resource = createResource('inventory_items', { searchColumns: ['name', 'sku'] });
const hooks = createResourceHooks(resource, { label: 'Item inventaris' });

const CATEGORY = [
  { value: 'feed', label: 'Pakan' },
  { value: 'medicine', label: 'Obat' },
  { value: 'vitamin', label: 'Vitamin' },
  { value: 'equipment', label: 'Peralatan' },
  { value: 'other', label: 'Lainnya' },
];

// Catatan: `quantity` sengaja TIDAK ada di form. Stok hanya berubah lewat
// gerakan stok (stock_move) agar ledger stock_movements tetap jadi sumber
// kebenaran. Item baru dibuat dengan stok 0, lalu diisi via aksi "Sesuaikan stok".
const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  category: z.enum(['feed', 'medicine', 'vitamin', 'equipment', 'other']),
  sku: z.string().optional().or(z.literal('')),
  unit: z.string().min(1, 'Wajib diisi'),
  min_quantity: z.coerce.number().min(0),
  unit_cost: z.coerce.number().min(0).optional().or(z.literal('')),
  expires_at: z.string().optional().or(z.literal('')),
});
type Values = z.infer<typeof schema>;

const fields: FieldDef[] = [
  { name: 'name', label: 'Nama item', type: 'text', required: true },
  { name: 'category', label: 'Kategori', type: 'select', options: CATEGORY },
  { name: 'sku', label: 'SKU', type: 'text' },
  { name: 'unit', label: 'Satuan', type: 'text', placeholder: 'kg, sak, botol…' },
  { name: 'min_quantity', label: 'Stok minimum', type: 'number', step: '0.01' },
  { name: 'unit_cost', label: 'Harga / satuan', type: 'number', step: '100' },
  { name: 'expires_at', label: 'Kedaluwarsa', type: 'date' },
];

const columns: Column<InventoryItemRow>[] = [
  {
    key: 'name',
    header: 'Item',
    render: (i) => (
      <div>
        <p className="font-medium text-foreground">{i.name}</p>
        <p className="text-xs capitalize text-muted-foreground">
          {CATEGORY.find((c) => c.value === i.category)?.label}
        </p>
      </div>
    ),
  },
  {
    key: 'stock',
    header: 'Stok',
    align: 'right',
    render: (i) => {
      const low = Number(i.quantity) <= Number(i.min_quantity);
      return (
        <div className="flex items-center justify-end gap-2">
          <span className="tabular-nums text-foreground">
            {Number(i.quantity).toLocaleString('id-ID')} {i.unit}
          </span>
          {low && <Badge tone="warning">Menipis</Badge>}
        </div>
      );
    },
  },
  { key: 'min', header: 'Min', align: 'right', render: (i) => <span className="tabular-nums text-muted-foreground">{Number(i.min_quantity).toLocaleString('id-ID')}</span> },
  { key: 'cost', header: 'Harga/satuan', align: 'right', render: (i) => formatCurrency(i.unit_cost) },
];

export default function InventoryPage() {
  const { can } = usePermission();
  const { data: branches = [] } = useBranches();
  const activeBranchId = useUiStore((s) => s.activeBranchId);
  const branchId = activeBranchId ?? branches[0]?.id ?? '';
  const [stockItem, setStockItem] = useState<InventoryItemRow | null>(null);

  return (
    <>
      <CrudListPage<'inventory_items', Values>
        hooks={hooks}
        permission="inventory"
        label="Item inventaris"
        title="Inventaris"
        description="Kelola stok pakan, obat, vitamin, dan peralatan. Ubah jumlah lewat tombol Sesuaikan stok."
        icon={Boxes}
        searchPlaceholder="Cari item atau SKU…"
        columns={columns}
        fields={fields}
        schema={schema}
        formSize="xl"
        toFormValues={(i) => ({
          name: i?.name ?? '',
          category: i?.category ?? 'feed',
          sku: i?.sku ?? '',
          unit: i?.unit ?? 'kg',
          min_quantity: i?.min_quantity ?? 0,
          unit_cost: i?.unit_cost ?? '',
          expires_at: i?.expires_at ?? '',
        })}
        toCreate={(v) => ({ ...emptyToNull(v), quantity: 0, branch_id: branchId }) as InsertDto<'inventory_items'>}
        toUpdate={(v) => emptyToNull(v) as UpdateDto<'inventory_items'>}
        deleteText={(i) => `Item \"${i.name}\" akan diarsipkan.`}
        rowActions={(i) =>
          can('inventory', 'update') ? (
            <button
              onClick={() => setStockItem(i)}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Sesuaikan stok"
              title="Sesuaikan stok"
            >
              <ArrowLeftRight className="size-4" />
            </button>
          ) : null
        }
      />

      <StockMoveModal open={Boolean(stockItem)} item={stockItem} onClose={() => setStockItem(null)} />
    </>
  );
}
