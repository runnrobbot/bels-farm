/**
 * Centralized, type-safe query key factory.
 * Keeping every key in one place prevents subtle cache-collision bugs.
 */
export const queryKeys = {
  animals: {
    all: ['animals'] as const,
    lists: () => [...queryKeys.animals.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.animals.lists(), filters] as const,
    details: () => [...queryKeys.animals.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.animals.details(), id] as const,
    timeline: (id: string) => [...queryKeys.animals.detail(id), 'timeline'] as const,
    weights: (id: string) => [...queryKeys.animals.detail(id), 'weights'] as const,
  },
  breeds: {
    list: (species?: string) => ['breeds', 'list', species ?? 'all'] as const,
  },
  dashboard: {
    stats: (branchId: string | null) => ['dashboard', 'stats', branchId] as const,
  },
  settings: {
    branches: ['settings', 'branches'] as const,
  },
} as const;
