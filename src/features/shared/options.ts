import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { IN_STOCK_STATUS_LIST } from '@/features/livestock/status';
import type { AnimalSex } from '@/types/database';

export interface Option {
  value: string;
  label: string;
}

const FIVE_MIN = 5 * 60_000;

/**
 * Real animal options for selects (no mock data). Optionally filter by sex —
 * used for choosing dam (female) / sire (male) in the breeding module.
 *
 * By default only in-stock animals (active / reserved / quarantine) are
 * returned, so sold, deceased or transferred animals never appear as
 * selectable in feeding, breeding or health forms. Pass `includeAllStatuses`
 * when a form genuinely needs the full roster (e.g. a historical/audit view).
 */
export function useAnimalOptions(opts?: { sex?: AnimalSex; includeAllStatuses?: boolean }) {
  return useQuery({
    queryKey: ['options', 'animals', opts?.sex ?? 'all', opts?.includeAllStatuses ? 'any' : 'in_stock'],
    queryFn: async (): Promise<Option[]> => {
      let query = supabase
        .from('animals')
        .select('id, ear_tag, name, sex')
        .is('deleted_at', null)
        .order('ear_tag')
        .limit(500);
      if (!opts?.includeAllStatuses) query = query.in('status', IN_STOCK_STATUS_LIST);
      if (opts?.sex) query = query.eq('sex', opts.sex);
      const { data, error } = await query;
      if (error) throw toAppError(error);
      return (data ?? []).map((a) => ({
        value: a.id,
        label: a.name ? `${a.ear_tag} · ${a.name}` : a.ear_tag,
      }));
    },
    staleTime: FIVE_MIN,
  });
}

export function usePenOptions() {
  return useQuery({
    queryKey: ['options', 'pens'],
    queryFn: async (): Promise<Option[]> => {
      const { data, error } = await supabase
        .from('pens')
        .select('id, name')
        .is('deleted_at', null)
        .order('name');
      if (error) throw toAppError(error);
      return (data ?? []).map((p) => ({ value: p.id, label: p.name }));
    },
    staleTime: FIVE_MIN,
  });
}

export function useEmployeeOptions() {
  return useQuery({
    queryKey: ['options', 'employees'],
    queryFn: async (): Promise<Option[]> => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name')
        .is('deleted_at', null)
        .order('full_name');
      if (error) throw toAppError(error);
      return (data ?? []).map((e) => ({ value: e.id, label: e.full_name }));
    },
    staleTime: FIVE_MIN,
  });
}

/** Build a quick id→label lookup from an options array (for table cells). */
export function optionMap(options: Option[]): Map<string, string> {
  return new Map(options.map((o) => [o.value, o.label]));
}
