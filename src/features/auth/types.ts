import type { PermissionAction, ProfileRow } from '@/types/database';

/** Resources that participate in RBAC. Mirrors the seeded permission catalog. */
export type Resource =
  | 'livestock'
  | 'health'
  | 'breeding'
  | 'feeding'
  | 'inventory'
  | 'supplier'
  | 'customer'
  | 'employee'
  | 'finance'
  | 'qurban'
  | 'task'
  | 'calendar'
  | 'report'
  | 'cms'
  | 'audit'
  | 'settings'
  | 'dashboard'
  | 'chat';

/** Effective access resolved from the `my_access` RPC. */
export interface AccessContext {
  isSuperAdmin: boolean;
  branchIds: string[];
  roles: string[];
  /** Set of "resource:action" strings for O(1) permission checks. */
  permissions: Set<string>;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: ProfileRow | null;
  access: AccessContext;
}

export type PermissionTuple = `${Resource}:${PermissionAction}`;

export const EMPTY_ACCESS: AccessContext = {
  isSuperAdmin: false,
  branchIds: [],
  roles: [],
  permissions: new Set(),
};

/** O(1) check against a resolved access context. */
export function can(
  access: AccessContext,
  resource: Resource,
  action: PermissionAction,
): boolean {
  return access.isSuperAdmin || access.permissions.has(`${resource}:${action}`);
}
