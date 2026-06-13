/**
 * Centralized, type-safe query key factory.
 *
 * Keeping every key in one place prevents subtle cache-collision bugs and makes
 * targeted invalidation trivial (e.g. invalidate `animals.lists()` after a
 * mutation while leaving unrelated caches warm).
 */
export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
    permissions: (userId: string) => ['auth', 'permissions', userId] as const,
  },
  dashboard: {
    stats: (branchId: string | null) => ['dashboard', 'stats', branchId] as const,
  },
  animals: {
    all: ['animals'] as const,
    lists: () => [...queryKeys.animals.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.animals.lists(), filters] as const,
    details: () => [...queryKeys.animals.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.animals.details(), id] as const,
    timeline: (id: string) => [...queryKeys.animals.detail(id), 'timeline'] as const,
    weights: (id: string) => [...queryKeys.animals.detail(id), 'weights'] as const,
    prices: (id: string) => [...queryKeys.animals.detail(id), 'prices'] as const,
    media: (id: string) => [...queryKeys.animals.detail(id), 'media'] as const,
  },
  breeds: {
    all: ['breeds'] as const,
    list: (species?: string) => ['breeds', 'list', species ?? 'all'] as const,
  },
  pens: {
    byBranch: (branchId: string) => ['pens', branchId] as const,
  },
  health: {
    byAnimal: (animalId: string) => ['health', animalId] as const,
    reminders: () => ['health', 'reminders'] as const,
  },
  breeding: {
    all: ['breeding'] as const,
    reminders: () => ['breeding', 'reminders'] as const,
  },
  inventory: {
    list: (branchId: string) => ['inventory', branchId] as const,
    lowStock: (branchId: string) => ['inventory', branchId, 'low-stock'] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: (filters: Record<string, unknown>) => ['customers', 'list', filters] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },
  employees: {
    all: ['employees'] as const,
    list: (filters: Record<string, unknown>) => ['employees', 'list', filters] as const,
  },
  finance: {
    transactions: (filters: Record<string, unknown>) => ['finance', 'tx', filters] as const,
    summary: (range: string) => ['finance', 'summary', range] as const,
    categories: ['finance', 'categories'] as const,
  },
  qurban: {
    plans: ['qurban', 'plans'] as const,
    enrollments: (planId: string) => ['qurban', 'enrollments', planId] as const,
  },
  tasks: {
    list: (filters: Record<string, unknown>) => ['tasks', 'list', filters] as const,
  },
  calendar: {
    range: (from: string, to: string) => ['calendar', from, to] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
  settings: {
    roles: ['settings', 'roles'] as const,
    permissions: ['settings', 'permissions'] as const,
    divisions: ['settings', 'divisions'] as const,
    branches: ['settings', 'branches'] as const,
    users: ['settings', 'users'] as const,
  },
  audit: {
    list: (filters: Record<string, unknown>) => ['audit', filters] as const,
  },
} as const;
