import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { toast } from '@/stores/toastStore';

export type StockMoveType = 'in' | 'out' | 'adjustment';

export interface StockMoveInput {
  itemId: string;
  type: StockMoveType;
  quantity: number;
  unitCost?: number | null;
  reference?: string | null;
  supplierId?: string | null;
  notes?: string | null;
}

/**
 * Records a single inventory movement through the `stock_move` RPC — the one
 * and only entry point for changing stock. The database trigger
 * `trg_apply_stock_movement` applies the delta to `inventory_items.quantity`
 * (and rejects moves that would drive stock negative), so the client never
 * writes `quantity` directly. This keeps `stock_movements` an authoritative,
 * append-only ledger and prevents the silent drift that let a sold animal /
 * mis-set quantity slip between views.
 *
 * `stock_move` is newer than the generated Supabase types, so the RPC call is
 * cast in this single place instead of loosening types across the app.
 */
export async function stockMove(input: StockMoveInput): Promise<void> {
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: unknown }>;

  const { error } = await rpc('stock_move', {
    p_item_id: input.itemId,
    p_type: input.type,
    p_quantity: input.quantity,
    p_unit_cost: input.unitCost ?? null,
    p_reference: input.reference ?? null,
    p_supplier_id: input.supplierId ?? null,
    p_notes: input.notes ?? null,
  });
  if (error) throw toAppError(error);
}

/** Mutation wrapper that refreshes inventory + dashboard caches on success. */
export function useStockMove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: stockMove,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['resource', 'inventory_items'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      void qc.invalidateQueries({ queryKey: ['options', 'feed-items'] });
      toast.success('Stok diperbarui');
    },
    onError: (error) => toast.fromError(error, 'Gagal memperbarui stok'),
  });
}
