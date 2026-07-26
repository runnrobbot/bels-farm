import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Field } from '@/components/ui/Field';
import { useSupplierOptions } from '@/features/shared/options';
import { useStockMove, type StockMoveType } from './stockService';
import type { InventoryItemRow } from '@/types/database';

const schema = z
  .object({
    type: z.enum(['in', 'out', 'adjustment']),
    quantity: z.coerce.number(),
    supplier_id: z.string().optional().or(z.literal('')),
    unit_cost: z.coerce.number().min(0).optional().or(z.literal('')),
    reference: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
  })
  .refine((v) => (v.type === 'adjustment' ? v.quantity >= 0 : v.quantity > 0), {
    message: 'Jumlah harus lebih dari 0',
    path: ['quantity'],
  });
type Values = z.infer<typeof schema>;

const TYPE_OPTIONS = [
  { value: 'in', label: 'Masuk / restock' },
  { value: 'out', label: 'Keluar / pemakaian' },
  { value: 'adjustment', label: 'Penyesuaian (set jumlah absolut)' },
];

const DEFAULTS = {
  type: 'in',
  quantity: 0,
  supplier_id: '',
  unit_cost: '',
  reference: '',
  notes: '',
};

interface Props {
  open: boolean;
  item: InventoryItemRow | null;
  onClose: () => void;
}

/**
 * Modal for every stock change on an inventory item. Routes through the
 * `stock_move` RPC so the ledger (and negative-stock guard) stays the single
 * source of truth. "Masuk" doubles as supplier restock (supplier + unit cost).
 */
export function StockMoveModal({ open, item, onClose }: Props) {
  const move = useStockMove();
  const { data: suppliers = [] } = useSupplierOptions();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema) as Resolver<Values>,
    defaultValues: DEFAULTS as never,
  });

  useEffect(() => {
    if (open) reset(DEFAULTS as never);
  }, [open, reset]);

  const type = watch('type');

  const onSubmit = (v: Values) => {
    if (!item) return;
    move.mutate(
      {
        itemId: item.id,
        type: v.type as StockMoveType,
        quantity: Number(v.quantity),
        unitCost: v.unit_cost === '' || v.unit_cost == null ? null : Number(v.unit_cost),
        supplierId: v.supplier_id ? String(v.supplier_id) : null,
        reference: v.reference ? String(v.reference) : null,
        notes: v.notes ? String(v.notes) : null,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? `Sesuaikan stok — ${item.name}` : 'Sesuaikan stok'}
      description={
        item ? `Stok saat ini: ${Number(item.quantity).toLocaleString('id-ID')} ${item.unit}` : undefined
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button form="stock-move-form" type="submit" loading={move.isPending}>
            Simpan
          </Button>
        </>
      }
    >
      <form
        id="stock-move-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <Field label="Jenis gerakan" className="sm:col-span-2">
          <Select options={TYPE_OPTIONS} {...register('type')} />
        </Field>

        <Field
          label={type === 'adjustment' ? 'Jumlah stok baru' : 'Jumlah'}
          required
          error={errors.quantity?.message}
          hint={
            type === 'in'
              ? 'Menambah stok'
              : type === 'out'
                ? 'Mengurangi stok'
                : 'Mengganti stok ke nilai absolut ini'
          }
        >
          <Input type="number" step="0.01" invalid={!!errors.quantity} {...register('quantity')} />
        </Field>

        {type === 'in' && (
          <>
            <Field label="Pemasok" hint="Opsional">
              <Select placeholder="Tanpa pemasok" options={suppliers} {...register('supplier_id')} />
            </Field>
            <Field label="Harga / satuan" hint="Opsional">
              <Input type="number" step="100" invalid={!!errors.unit_cost} {...register('unit_cost')} />
            </Field>
            <Field label="Referensi / no. nota" hint="Opsional" className="sm:col-span-2">
              <Input type="text" {...register('reference')} />
            </Field>
          </>
        )}

        <Field label="Catatan" className="sm:col-span-2">
          <Textarea {...register('notes')} />
        </Field>
      </form>
    </Modal>
  );
}
