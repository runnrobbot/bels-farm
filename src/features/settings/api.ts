import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { createResource } from '@/lib/crud/resource';
import { createResourceHooks } from '@/lib/crud/useResource';
import type { RoleRow, PermissionRow, ProfileRow, UserRoleRow } from '@/types/database';

// --- Divisions --------------------------------------------------------------
export const divisionsResource = createResource('divisions', { searchColumns: ['name'] });
export const divisionsHooks = createResourceHooks(divisionsResource, { label: 'Divisi' });

export const divisionSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  description: z.string().optional().or(z.literal('')),
  color: z.string().optional().or(z.literal('')),
});
export type DivisionValues = z.infer<typeof divisionSchema>;

/** Lightweight option list for selects. */
export function useDivisionOptions() {
  return useQuery({
    queryKey: ['settings', 'division-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('divisions')
        .select('id, name')
        .is('deleted_at', null)
        .order('name');
      if (error) throw toAppError(error);
      return (data ?? []).map((d) => ({ value: d.id, label: d.name }));
    },
    staleTime: 5 * 60_000,
  });
}

// --- Roles & permissions ----------------------------------------------------
export function useRoles() {
  return useQuery({
    queryKey: ['settings', 'roles'],
    queryFn: async (): Promise<RoleRow[]> => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .is('deleted_at', null)
        .order('is_system', { ascending: false });
      if (error) throw toAppError(error);
      return data ?? [];
    },
  });
}

export function usePermissionCatalog() {
  return useQuery({
    queryKey: ['settings', 'permissions'],
    queryFn: async (): Promise<PermissionRow[]> => {
      const { data, error } = await supabase.from('permissions').select('*').order('resource');
      if (error) throw toAppError(error);
      return data ?? [];
    },
    staleTime: 10 * 60_000,
  });
}

// --- Users (profiles + their roles) -----------------------------------------
export interface UserWithRoles extends ProfileRow {
  user_roles: (UserRoleRow & { role: { name: string } | null })[];
}

export function useUsers() {
  return useQuery({
    queryKey: ['settings', 'users'],
    queryFn: async (): Promise<UserWithRoles[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_roles(*, role:roles(name))')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw toAppError(error);
      return (data ?? []) as unknown as UserWithRoles[];
    },
  });
}

// --- Branches ---------------------------------------------------------------
export const branchesResource = createResource('branches', { searchColumns: ['name', 'code'] });
export const branchesHooks = createResourceHooks(branchesResource, { label: 'Cabang' });

export const branchSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  code: z.string().min(1, 'Kode wajib diisi'),
  address: z.string().optional().or(z.literal('')),
  timezone: z.string().min(1).optional().or(z.literal('')),
});
export type BranchValues = z.infer<typeof branchSchema>;

// --- Role assignment mutations ----------------------------------------------
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/stores/toastStore';

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleId } as never);
      if (error) throw toAppError(error);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['settings', 'users'] });
      toast.success('Peran ditetapkan');
    },
    onError: (e) => toast.fromError(e, 'Gagal menetapkan peran'),
  });
}

export function useRemoveUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userRoleId: string) => {
      const { error } = await supabase.from('user_roles').delete().eq('id', userRoleId);
      if (error) throw toAppError(error);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['settings', 'users'] });
      toast.success('Peran dicabut');
    },
    onError: (e) => toast.fromError(e, 'Gagal mencabut peran'),
  });
}
