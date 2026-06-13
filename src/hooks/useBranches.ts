import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { queryKeys } from '@/lib/query/queryKeys';
import type { BranchRow } from '@/types/database';

/** All active branches the user can see (RLS scopes this server-side). */
export function useBranches() {
  return useQuery({
    queryKey: queryKeys.settings.branches,
    queryFn: async (): Promise<BranchRow[]> => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('name');
      if (error) throw toAppError(error);
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}
