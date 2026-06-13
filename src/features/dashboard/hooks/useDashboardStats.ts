import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { queryKeys } from '@/lib/query/queryKeys';
import { useUiStore } from '@/stores/uiStore';

export function useDashboardStats() {
  const branchId = useUiStore((s) => s.activeBranchId);
  return useQuery({
    queryKey: queryKeys.dashboard.stats(branchId),
    queryFn: () => dashboardService.getStats(branchId),
    staleTime: 60_000,
  });
}
