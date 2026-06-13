import { QueryClient } from '@tanstack/react-query';
import { AppError } from '@/lib/errors';

/**
 * App-wide TanStack Query client.
 *
 * - Sensible staleTime so navigation feels instant without hammering Supabase.
 * - Retries are skipped for deterministic auth/permission failures.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof AppError) {
          if (['unauthorized', 'forbidden', 'not_found', 'validation'].includes(error.code)) {
            return false;
          }
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
