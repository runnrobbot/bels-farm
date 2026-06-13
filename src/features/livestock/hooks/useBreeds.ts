import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { queryKeys } from '@/lib/query/queryKeys';
import type { BreedRow, Species } from '@/types/database';

export function useBreeds(species?: Species) {
  return useQuery({
    queryKey: queryKeys.breeds.list(species),
    queryFn: async (): Promise<BreedRow[]> => {
      let query = supabase
        .from('breeds')
        .select('*')
        .is('deleted_at', null)
        .order('name');
      if (species) query = query.eq('species', species);
      const { data, error } = await query;
      if (error) throw toAppError(error);
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}
