import { describe, expect, it } from 'vitest';
import { can, EMPTY_ACCESS, type AccessContext } from './types';

describe('can()', () => {
  const access: AccessContext = {
    isSuperAdmin: false,
    branchIds: [],
    roles: ['staff'],
    permissions: new Set(['livestock:view', 'livestock:create', 'feeding:create']),
  };

  it('grants when the permission tuple is present', () => {
    expect(can(access, 'livestock', 'view')).toBe(true);
    expect(can(access, 'feeding', 'create')).toBe(true);
  });

  it('denies when the permission tuple is missing', () => {
    expect(can(access, 'livestock', 'delete')).toBe(false);
    expect(can(access, 'finance', 'view')).toBe(false);
  });

  it('grants everything to a super admin regardless of permission set', () => {
    const superAdmin: AccessContext = { ...EMPTY_ACCESS, isSuperAdmin: true };
    expect(can(superAdmin, 'settings', 'delete')).toBe(true);
    expect(can(superAdmin, 'audit', 'export')).toBe(true);
  });
});
