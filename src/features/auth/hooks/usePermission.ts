import { useCallback } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { can, type Resource } from '@/features/auth/types';
import type { PermissionAction } from '@/types/database';

/**
 * Returns a stable `can(resource, action)` checker plus common role flags.
 * Components use this for conditional rendering; the DB enforces the real rules
 * via RLS, so this is purely a UX affordance (never a security boundary).
 */
export function usePermission() {
  const { access } = useAuth();

  const check = useCallback(
    (resource: Resource, action: PermissionAction) => can(access, resource, action),
    [access],
  );

  return {
    can: check,
    isSuperAdmin: access.isSuperAdmin,
    roles: access.roles,
    branchIds: access.branchIds,
  };
}
