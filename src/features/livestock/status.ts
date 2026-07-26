import type { AnimalStatus } from '@/types/database';

/**
 * Single source of truth for what "in stock" means across the app.
 *
 * Historically each surface (Livestock list, select dropdowns, dashboard count)
 * applied its own ad-hoc status filter. A status change such as `sold` could
 * therefore make an animal silently vanish from one view while still lingering
 * in another (this is exactly how a sold animal "disappeared" from Ternak while
 * still showing up under Feeding/Breeding). Import these constants everywhere
 * instead of hard-coding status strings so every surface agrees on the same
 * definition.
 */

/** Animals physically present in the herd (counted as live population). */
export const IN_STOCK_STATUSES = ['active', 'reserved', 'quarantine'] as const;

/** Animals that may be listed / submitted for sale. */
export const SELLABLE_STATUSES = ['active'] as const;

/** Terminal statuses — the animal has permanently left the herd. */
export const TERMINAL_STATUSES = ['sold', 'deceased', 'transferred'] as const;

export type InStockStatus = (typeof IN_STOCK_STATUSES)[number];

/**
 * Mutable copies typed as AnimalStatus[] for Supabase `.in('status', ...)`
 * filters, which require the column's enum type (not a plain string[]).
 */
export const IN_STOCK_STATUS_LIST: AnimalStatus[] = [...IN_STOCK_STATUSES];
export const SELLABLE_STATUS_LIST: AnimalStatus[] = [...SELLABLE_STATUSES];
export const TERMINAL_STATUS_LIST: AnimalStatus[] = [...TERMINAL_STATUSES];

export function isInStock(status: AnimalStatus | null | undefined): boolean {
  return status != null && (IN_STOCK_STATUSES as readonly string[]).includes(status);
}

export function isSellable(status: AnimalStatus | null | undefined): boolean {
  return status != null && (SELLABLE_STATUSES as readonly string[]).includes(status);
}

export function isTerminal(status: AnimalStatus | null | undefined): boolean {
  return status != null && (TERMINAL_STATUSES as readonly string[]).includes(status);
}
