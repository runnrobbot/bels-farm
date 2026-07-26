import { supabase } from '@/lib/supabase/client';
import { toAppError, unwrap } from '@/lib/errors';
import { castAs } from '@/lib/utils';
import type { AnimalFilters } from '../schema';
import { IN_STOCK_STATUS_LIST } from '../status';
import type {
  AnimalRow,
  ActivityEventRow,
  WeightRecordRow,
  InsertDto,
  UpdateDto,
} from '@/types/database';

/** Animal row joined with its breed name for list/detail display. */
export interface AnimalWithBreed extends AnimalRow {
  breed: { name: string } | null;
}

export interface AnimalPage {
  rows: AnimalWithBreed[];
  total: number;
}

const LIST_SELECT = '*, breed:breeds(name)';

/**
 * Remove characters that are structural inside a PostgREST `.or()` filter
 * (comma separates conditions, parentheses group them). Without this a search
 * like "3,5 kg" or "(afkir)" breaks the query or injects filter logic.
 */
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()]/g, '').trim();
}

export const livestockService = {
  async list(filters: AnimalFilters, branchId: string | null): Promise<AnimalPage> {
    const from = filters.page * filters.pageSize;
    const to = from + filters.pageSize - 1;

    let query = supabase
      .from('animals')
      .select(LIST_SELECT, { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (branchId) query = query.eq('branch_id', branchId);
    if (filters.species && filters.species !== 'all') query = query.eq('species', filters.species);
    // 'in_stock' expands to the shared IN_STOCK_STATUSES set so active, reserved
    // and quarantine animals all stay visible by default; 'all' applies no status
    // filter; anything else is an exact status match.
    if (filters.status === 'in_stock') {
      query = query.in('status', IN_STOCK_STATUS_LIST);
    } else if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    const search = filters.search ? sanitizeSearchTerm(filters.search) : '';
    if (search) {
      const term = `%${search}%`;
      query = query.or(`ear_tag.ilike.${term},name.ilike.${term},barcode.ilike.${term}`);
    }

    const { data, error, count } = await query;
    if (error) throw toAppError(error);
    return { rows: castAs<AnimalWithBreed[]>(data ?? []), total: count ?? 0 };
  },

  async getById(id: string): Promise<AnimalWithBreed> {
    return castAs<AnimalWithBreed>(
      unwrap(await supabase.from('animals').select(LIST_SELECT).eq('id', id).single()),
    );
  },

  async getByQrCode(qr: string): Promise<AnimalWithBreed | null> {
    const { data, error } = await supabase
      .from('animals')
      .select(LIST_SELECT)
      .eq('qr_code', qr)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw toAppError(error);
    return castAs<AnimalWithBreed | null>(data);
  },

  /** Resolve a scanned/typed code against qr_code, barcode, or ear_tag. */
  async findByCode(code: string): Promise<AnimalWithBreed | null> {
    const term = code.trim().replace(/[,()]/g, '');
    if (!term) return null;
    const { data, error } = await supabase
      .from('animals')
      .select(LIST_SELECT)
      .or(`qr_code.eq.${term},barcode.eq.${term},ear_tag.eq.${term}`)
      .is('deleted_at', null)
      .limit(1);
    if (error) throw toAppError(error);
    const rows = castAs<AnimalWithBreed[]>(data ?? []);
    return rows[0] ?? null;
  },

  async create(input: InsertDto<'animals'>): Promise<AnimalRow> {
    return unwrap(await supabase.from('animals').insert(input).select('*').single()) as AnimalRow;
  },

  async update(id: string, patch: UpdateDto<'animals'>): Promise<AnimalRow> {
    return unwrap(
      await supabase.from('animals').update(patch).eq('id', id).select('*').single(),
    ) as AnimalRow;
  },

  /** Soft delete — sets deleted_at so the record (and its history) is retained. */
  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('animals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw toAppError(error);
  },

  async timeline(animalId: string): Promise<ActivityEventRow[]> {
    const { data, error } = await supabase
      .from('activity_events')
      .select('*')
      .eq('entity_type', 'animal')
      .eq('entity_id', animalId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw toAppError(error);
    return data ?? [];
  },

  async weights(animalId: string): Promise<WeightRecordRow[]> {
    const { data, error } = await supabase
      .from('weight_records')
      .select('*')
      .eq('animal_id', animalId)
      .is('deleted_at', null)
      .order('measured_at', { ascending: true });
    if (error) throw toAppError(error);
    return data ?? [];
  },

  async addWeight(input: InsertDto<'weight_records'>): Promise<WeightRecordRow> {
    return unwrap(
      await supabase.from('weight_records').insert(input).select('*').single(),
    ) as WeightRecordRow;
  },
};
