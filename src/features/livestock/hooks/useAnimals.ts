import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { livestockService } from '../services/livestockService';
import type { AnimalFilters } from '../schema';
import { queryKeys } from '@/lib/query/queryKeys';
import { useUiStore } from '@/stores/uiStore';

/** Paginated, filtered animal list. Keeps previous page visible while fetching. */
export function useAnimals(filters: AnimalFilters) {
  const branchId = useUiStore((s) => s.activeBranchId);
  return useQuery({
    queryKey: queryKeys.animals.list({ ...filters, branchId }),
    queryFn: () => livestockService.list(filters, branchId),
    placeholderData: keepPreviousData,
  });
}

export function useAnimal(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.animals.detail(id ?? 'none'),
    queryFn: () => livestockService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useAnimalTimeline(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.animals.timeline(id ?? 'none'),
    queryFn: () => livestockService.timeline(id as string),
    enabled: Boolean(id),
  });
}

export function useAnimalWeights(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.animals.weights(id ?? 'none'),
    queryFn: () => livestockService.weights(id as string),
    enabled: Boolean(id),
  });
}
