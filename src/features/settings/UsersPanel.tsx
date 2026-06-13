import { useState } from 'react';
import { ShieldPlus, X, UserCog } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { DataTable, type Column } from '@/components/data/DataTable';
import {
  useUsers,
  useRoles,
  useAssignRole,
  useRemoveUserRole,
  type UserWithRoles,
} from '@/features/settings/api';

export function UsersPanel() {
  const { data: users = [], isLoading } = useUsers();
  const { data: roles = [] } = useRoles();
  const assign = useAssignRole();
  const removeRole = useRemoveUserRole();

  const [assignFor, setAssignFor] = useState<UserWithRoles | null>(null);
  const [roleId, setRoleId] = useState('');

  const columns: Column<UserWithRoles>[] = [
    {
      key: 'user',
      header: 'Pengguna',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.full_name || u.email} size="sm" />
          <div>
            <p className="font-medium text-foreground">{u.full_name || '—'}</p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Peran',
      render: (u) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {u.is_super_admin && <Badge tone="primary">Super Admin</Badge>}
          {u.user_roles.map((ur) => (
            <span key={ur.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground">
              {ur.role?.name ?? 'Peran'}
              <button
                onClick={() => removeRole.mutate(ur.id)}
                className="text-muted-foreground hover:text-danger"
                aria-label="Cabut peran"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          {!u.is_super_admin && u.user_roles.length === 0 && (
            <span className="text-xs text-muted-foreground">Belum ada peran</span>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (u) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setAssignFor(u);
            setRoleId('');
          }}
        >
          <ShieldPlus className="size-4" /> Tetapkan peran
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="panel space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  return (
    <>
      <DataTable columns={columns} rows={users} rowKey={(u) => u.id} />

      <Modal
        open={Boolean(assignFor)}
        onClose={() => setAssignFor(null)}
        title="Tetapkan peran"
        description={assignFor ? `Untuk ${assignFor.full_name || assignFor.email}` : ''}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssignFor(null)}>
              Batal
            </Button>
            <Button
              loading={assign.isPending}
              disabled={!roleId}
              onClick={() =>
                assignFor &&
                roleId &&
                assign.mutate(
                  { userId: assignFor.id, roleId },
                  { onSuccess: () => setAssignFor(null) },
                )
              }
            >
              Tetapkan
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-muted text-primary">
            <UserCog className="size-5" />
          </span>
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Pilih peran</label>
            <Select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              placeholder="Pilih peran"
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
