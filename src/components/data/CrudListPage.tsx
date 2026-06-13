import { useState, type ReactNode } from 'react';
import type { FieldValues } from 'react-hook-form';
import type { ZodType } from 'zod';
import { Plus, Search, Pencil, Trash2, type LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { DataTable, type Column } from '@/components/data/DataTable';
import { TablePagination } from '@/components/data/TablePagination';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { CrudFormModal, type FieldDef } from '@/components/data/CrudFormModal';
import { usePermission } from '@/features/auth/hooks/usePermission';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { createResourceHooks } from '@/lib/crud/useResource';
import type { Row, TableName, Insert, Update } from '@/lib/crud/resource';
import type { Resource as PermResource } from '@/features/auth/types';

interface CrudListPageProps<T extends TableName, V extends FieldValues> {
  hooks: ReturnType<typeof createResourceHooks<T>>;
  permission: PermResource;
  label: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  columns: Column<Row<T>>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  /** Form definition. */
  fields: FieldDef[];
  schema: ZodType<V>;
  formSize?: 'md' | 'lg' | 'xl';
  toFormValues: (row: Row<T> | null) => V;
  toCreate: (values: V) => Insert<T>;
  toUpdate: (values: V) => Update<T>;
  deleteText: (row: Row<T>) => string;
  /** Extra non-edit/delete row actions (e.g. a status toggle). */
  rowActions?: (row: Row<T>) => ReactNode;
  /** Extra toolbar content to the right of search. */
  toolbar?: ReactNode;
  /** Content rendered between the page header and the toolbar (e.g. summary cards). */
  beforeContent?: ReactNode;
}

/**
 * Full-featured admin list page: search, pagination, create/edit modal, and
 * soft-delete confirmation — all permission-aware. Modules provide only their
 * columns, field schema and payload mappers.
 */
export function CrudListPage<T extends TableName, V extends FieldValues>(props: CrudListPageProps<T, V>) {
  const {
    hooks,
    permission,
    label,
    title,
    description,
    icon: Icon,
    columns,
    searchable = true,
    searchPlaceholder = 'Cari…',
    pageSize = 15,
    fields,
    schema,
    formSize = 'lg',
    toFormValues,
    toCreate,
    toUpdate,
    deleteText,
    rowActions,
    toolbar,
    beforeContent,
  } = props;

  const { can } = usePermission();
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Row<T> | null>(null);
  const [toDelete, setToDelete] = useState<Row<T> | null>(null);

  const { data, isLoading } = hooks.useList({ search, page, pageSize });
  const create = hooks.useCreate();
  const update = hooks.useUpdate();
  const remove = hooks.useRemove();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: Row<T>) => {
    setEditing(row);
    setFormOpen(true);
  };

  const handleSubmit = (values: V) => {
    if (editing) {
      const id = (editing as { id: string }).id;
      update.mutate({ id, patch: toUpdate(values) }, { onSuccess: () => setFormOpen(false) });
    } else {
      create.mutate(toCreate(values), { onSuccess: () => setFormOpen(false) });
    }
  };

  const actionsColumn: Column<Row<T>> = {
    key: '__actions',
    header: '',
    align: 'right',
    render: (row) => (
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        {rowActions?.(row)}
        {can(permission, 'update') && (
          <button
            onClick={() => openEdit(row)}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Ubah"
          >
            <Pencil className="size-4" />
          </button>
        )}
        {can(permission, 'delete') && (
          <button
            onClick={() => setToDelete(row)}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
            aria-label="Hapus"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    ),
  };

  const canEditOrDelete = can(permission, 'update') || can(permission, 'delete') || Boolean(rowActions);
  const allColumns = canEditOrDelete ? [...columns, actionsColumn] : columns;

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          can(permission, 'create') && (
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Tambah
            </Button>
          )
        }
      />

      {beforeContent}

      {(searchable || toolbar) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {searchable && (
            <div className="max-w-md flex-1">
              <Input
                icon={<Search className="size-4" />}
                placeholder={searchPlaceholder}
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      {isLoading ? (
        <div className="panel space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : (
        <>
          <DataTable
            columns={allColumns}
            rows={data?.rows ?? []}
            rowKey={(r) => (r as { id: string }).id}
            empty={
              <EmptyState
                icon={Icon}
                title={`Belum ada ${label.toLowerCase()}`}
                description={`Tambahkan ${label.toLowerCase()} pertama untuk memulai.`}
                action={
                  can(permission, 'create') && (
                    <Button onClick={openCreate}>
                      <Plus className="size-4" /> Tambah
                    </Button>
                  )
                }
              />
            }
          />
          {data && data.total > 0 && (
            <TablePagination page={page} pageSize={pageSize} total={data.total} label={label.toLowerCase()} onChange={setPage} />
          )}
        </>
      )}

      <CrudFormModal<V>
        open={formOpen}
        title={editing ? `Ubah ${label.toLowerCase()}` : `Tambah ${label.toLowerCase()}`}
        fields={fields}
        schema={schema}
        size={formSize}
        defaultValues={toFormValues(editing) as never}
        submitting={create.isPending || update.isPending}
        onSubmit={handleSubmit}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Hapus ${label.toLowerCase()}?`}
        description={toDelete ? deleteText(toDelete) : ''}
        confirmLabel="Hapus"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate((toDelete as { id: string }).id, { onSuccess: () => setToDelete(null) })}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
