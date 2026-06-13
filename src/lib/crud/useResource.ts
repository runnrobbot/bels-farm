import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from '@/stores/toastStore';
import type { ListParams, Resource, Row, Insert, Update, TableName } from './resource';

interface HookOptions {
  /** Human label used in toast messages, e.g. "Pelanggan". */
  label: string;
}

/**
 * Builds a set of React Query hooks bound to a CRUD resource. Mutations show
 * consistent success/error toasts and invalidate the resource's list caches.
 */
export function createResourceHooks<T extends TableName>(resource: Resource<T>, options: HookOptions) {
  const root = ['resource', resource.table] as const;
  const listKey = (params: ListParams) => [...root, 'list', params] as const;
  const detailKey = (id: string) => [...root, 'detail', id] as const;

  function useList(params: ListParams = {}) {
    return useQuery({
      queryKey: listKey(params),
      queryFn: () => resource.list(params),
      placeholderData: keepPreviousData,
    });
  }

  function useDetail(id: string | undefined) {
    return useQuery({
      queryKey: detailKey(id ?? 'none'),
      queryFn: () => resource.getById(id as string),
      enabled: Boolean(id),
    });
  }

  function useCreate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (input: Insert<T>) => resource.create(input),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: root });
        void qc.invalidateQueries({ queryKey: ['dashboard'] });
        toast.success(`${options.label} tersimpan`);
      },
      onError: (error) => toast.fromError(error, `Gagal menyimpan ${options.label.toLowerCase()}`),
    });
  }

  function useUpdate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: Update<T> }) => resource.update(id, patch),
      onSuccess: (row: Row<T>) => {
        void qc.invalidateQueries({ queryKey: root });
        const id = (row as { id?: string }).id;
        if (id) void qc.invalidateQueries({ queryKey: detailKey(id) });
        toast.success('Perubahan tersimpan');
      },
      onError: (error) => toast.fromError(error, 'Gagal menyimpan perubahan'),
    });
  }

  function useRemove() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => resource.remove(id),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: root });
        void qc.invalidateQueries({ queryKey: ['dashboard'] });
        toast.success(`${options.label} dihapus`);
      },
      onError: (error) => toast.fromError(error, `Gagal menghapus ${options.label.toLowerCase()}`),
    });
  }

  return { useList, useDetail, useCreate, useUpdate, useRemove, keys: { root, listKey, detailKey } };
}
