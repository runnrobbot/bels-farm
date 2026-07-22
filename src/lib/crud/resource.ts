import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import type { Database } from '@/types/database';

export type TableName = keyof Database['public']['Tables'];
export type Row<T extends TableName> = Database['public']['Tables'][T]['Row'];
export type Insert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
export type Update<T extends TableName> = Database['public']['Tables'][T]['Update'];

export type Filters = Record<string, string | number | boolean | null | undefined>;

export interface ListParams {
  search?: string;
  filters?: Filters;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  ascending?: boolean;
}

export interface Page<R> {
  rows: R[];
  total: number;
}

/**
 * Minimal structural view of a PostgREST builder. supabase-js filter methods
 * mutate and return the same instance, so we can apply dynamic (string-keyed)
 * filters through this cast while still awaiting the original, fully-typed
 * builder for the result. This keeps the public API type-safe without scattering
 * `any` through the codebase.
 */
interface QueryLike {
  eq(column: string, value: unknown): QueryLike;
  is(column: string, value: unknown): QueryLike;
  or(filters: string): QueryLike;
  order(column: string, options: { ascending: boolean }): QueryLike;
  range(from: number, to: number): QueryLike;
}

interface ResourceOptions {
  /** Select projection, e.g. '*, branch:branches(name)'. Defaults to '*'. */
  select?: string;
  /** Whether the table has a deleted_at column (enables soft delete + filter). */
  softDelete?: boolean;
  orderBy?: string;
  ascending?: boolean;
  /** Columns matched (ilike) by the free-text `search` param. */
  searchColumns?: string[];
}

/**
 * Factory producing typed CRUD operations for a single table. Centralizes
 * pagination, free-text search, soft delete and error normalization so feature
 * services/hooks stay declarative.
 */
export function createResource<T extends TableName>(table: T, options: ResourceOptions = {}) {
  const {
    select = '*',
    softDelete = true,
    orderBy = 'created_at',
    ascending = false,
    searchColumns = [],
  } = options;

  return {
    table,

    async list(params: ListParams = {}): Promise<Page<Row<T>>> {
      const page = params.page ?? 0;
      const pageSize = params.pageSize ?? 25;
      const from = page * pageSize;

      const query = supabase.from(table).select(select, { count: 'exact' });
      const f = query as unknown as QueryLike;

      if (softDelete) f.is('deleted_at', null);

      for (const [key, value] of Object.entries(params.filters ?? {})) {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          f.eq(key, value);
        }
      }

      const term = params.search?.trim();
      if (term && searchColumns.length > 0) {
        f.or(searchColumns.map((c) => `${c}.ilike.%${term}%`).join(','));
      }

      f.order(params.orderBy ?? orderBy, { ascending: params.ascending ?? ascending });
      f.range(from, from + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw toAppError(error);
      return { rows: (data ?? []) as unknown as Row<T>[], total: count ?? 0 };
    },

    async all(filters?: Filters): Promise<Row<T>[]> {
      const { rows } = await this.list({ filters, pageSize: 1000 });
      return rows;
    },

    async getById(id: string): Promise<Row<T>> {
      const query = supabase.from(table).select(select);
      (query as unknown as QueryLike).eq('id', id);
      const { data, error } = await query.single();
      if (error) throw toAppError(error);
      return data as unknown as Row<T>;
    },

    async create(input: Insert<T>): Promise<Row<T>> {
      const { data, error } = await supabase
        .from(table)
        .insert(input as never)
        .select(select)
        .single();
      if (error) throw toAppError(error);
      return data as unknown as Row<T>;
    },

    async update(id: string, patch: Update<T>): Promise<Row<T>> {
      const query = supabase
        .from(table)
        .update(patch as never)
        .select(select);
      (query as unknown as QueryLike).eq('id', id);
      const { data, error } = await query.single();
      if (error) throw toAppError(error);
      return data as unknown as Row<T>;
    },

    /** Soft delete when the table supports it; otherwise a hard delete. */
    async remove(id: string): Promise<void> {
      if (softDelete) {
        const query = supabase.from(table).update({ deleted_at: new Date().toISOString() } as never);
        (query as unknown as QueryLike).eq('id', id);
        const { error } = await query;
        if (error) throw toAppError(error);
      } else {
        const query = supabase.from(table).delete();
        (query as unknown as QueryLike).eq('id', id);
        const { error } = await query;
        if (error) throw toAppError(error);
      }
    },
  };
}

export type Resource<T extends TableName> = ReturnType<typeof createResource<T>>;
