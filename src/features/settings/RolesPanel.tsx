import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRoles, usePermissionCatalog } from '@/features/settings/api';
import type { PermissionAction } from '@/types/database';
import { cn } from '@/lib/utils';

const ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete', 'export', 'approve'];
const ACTION_LABEL: Record<PermissionAction, string> = {
  view: 'Lihat',
  create: 'Buat',
  update: 'Ubah',
  delete: 'Hapus',
  export: 'Ekspor',
  approve: 'Setujui',
};

/** Read-only role/permission matrix. Editing the matrix is the next iteration. */
export function RolesPanel() {
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: permissions = [] } = usePermissionCatalog();
  const [activeRole, setActiveRole] = useState<string | null>(null);

  const roleId = activeRole ?? roles[0]?.id ?? null;

  const { data: granted = new Set<string>() } = useQuery({
    queryKey: ['settings', 'role-permissions', roleId],
    enabled: Boolean(roleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission:permissions(resource, action)')
        .eq('role_id', roleId ?? '');
      if (error) throw toAppError(error);
      const set = new Set<string>();
      for (const row of (data ?? []) as unknown as { permission: { resource: string; action: string } | null }[]) {
        if (row.permission) set.add(`${row.permission.resource}:${row.permission.action}`);
      }
      return set;
    },
  });

  const resources = useMemo(
    () => Array.from(new Set(permissions.map((p) => p.resource))).sort(),
    [permissions],
  );

  if (rolesLoading) {
    return (
      <div className="panel space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveRole(r.id)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              roleId === r.id
                ? 'border-primary bg-primary-muted text-primary'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            {r.name}
            {r.is_system && <Badge tone="neutral">sistem</Badge>}
          </button>
        ))}
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-sunken">
              <th className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                Modul
              </th>
              {ACTIONS.map((a) => (
                <th key={a} className="px-3 py-3 text-center text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {ACTION_LABEL[a]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <tr key={resource} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2.5 font-medium capitalize text-foreground">{resource}</td>
                {ACTIONS.map((action) => {
                  const has = granted.has(`${resource}:${action}`);
                  return (
                    <td key={action} className="px-3 py-2.5 text-center">
                      {has ? (
                        <Check className="mx-auto size-4 text-success" />
                      ) : (
                        <Minus className="mx-auto size-4 text-muted-foreground/30" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Matriks hak akses bersifat dinamis dari basis data. Pengeditan langsung dari
        antarmuka menyusul pada iterasi berikutnya.
      </p>
    </div>
  );
}
