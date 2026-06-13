import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Contact, Pencil, Trash2, MessageCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { DataTable, type Column } from '@/components/data/DataTable';
import { TablePagination } from '@/components/data/TablePagination';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { customersHooks, customerSchema, type CustomerFormValues } from '@/features/customers/api';
import { usePermission } from '@/features/auth/hooks/usePermission';
import { useAuth } from '@/features/auth/AuthProvider';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { emptyToNull, whatsappLink } from '@/lib/utils';
import { format } from 'date-fns';
import type { CustomerRow } from '@/types/database';

const PAGE_SIZE = 15;

export default function CustomersPage() {
  const { can } = usePermission();
  const { profile } = useAuth();
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CustomerRow | null>(null);

  const { data, isLoading } = customersHooks.useList({ search, page, pageSize: PAGE_SIZE });
  const create = customersHooks.useCreate();
  const update = customersHooks.useUpdate();
  const remove = customersHooks.useRemove();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: CustomerRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  const handleSubmit = (values: CustomerFormValues) => {
    const clean = emptyToNull(values);
    if (editing) {
      update.mutate(
        { id: editing.id, patch: clean },
        { onSuccess: () => setFormOpen(false) },
      );
    } else {
      if (!profile?.organization_id) return;
      create.mutate(
        {
          ...clean,
          organization_id: profile.organization_id,
          created_by: profile.id,
          tags: [],
        },
        { onSuccess: () => setFormOpen(false) },
      );
    }
  };

  const columns: Column<CustomerRow>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Pelanggan',
        render: (c) => (
          <div>
            <p className="font-medium text-foreground">{c.full_name}</p>
            {c.city && <p className="text-xs text-muted-foreground">{c.city}</p>}
          </div>
        ),
      },
      {
        key: 'contact',
        header: 'Kontak',
        render: (c) => (
          <div className="text-sm">
            {c.whatsapp || c.phone ? <p className="text-foreground">{c.whatsapp || c.phone}</p> : <span className="text-muted-foreground">—</span>}
            {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
          </div>
        ),
      },
      {
        key: 'created',
        header: 'Terdaftar',
        render: (c) => <span className="text-muted-foreground">{format(new Date(c.created_at), 'd MMM yyyy')}</span>,
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (c) => (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {c.whatsapp && (
              <a
                href={whatsappLink(c.whatsapp, `Halo ${c.full_name}, dari BELS FARM.`)}
                target="_blank"
                rel="noreferrer"
                className="flex size-8 items-center justify-center rounded-md text-[#25D366] transition-colors hover:bg-muted"
                aria-label="WhatsApp"
              >
                <MessageCircle className="size-4" />
              </a>
            )}
            {can('customer', 'update') && (
              <button onClick={() => openEdit(c)} className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Ubah">
                <Pencil className="size-4" />
              </button>
            )}
            {can('customer', 'delete') && (
              <button onClick={() => setToDelete(c)} className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger" aria-label="Hapus">
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [can],
  );

  return (
    <div>
      <PageHeader
        title="Pelanggan"
        description="Kelola data pelanggan, kontak, dan riwayatnya."
        actions={
          can('customer', 'create') && (
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Tambah pelanggan
            </Button>
          )
        }
      />

      <div className="mb-4 max-w-md">
        <Input
          icon={<Search className="size-4" />}
          placeholder="Cari nama, WhatsApp, email…"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(0);
          }}
        />
      </div>

      {isLoading ? (
        <div className="panel space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.rows ?? []}
            rowKey={(c) => c.id}
            empty={
              <EmptyState
                icon={Contact}
                title="Belum ada pelanggan"
                description="Tambahkan pelanggan pertama Anda untuk mulai mencatat transaksi."
                action={can('customer', 'create') && <Button onClick={openCreate}><Plus className="size-4" /> Tambah pelanggan</Button>}
              />
            }
          />
          {data && data.total > 0 && (
            <TablePagination page={page} pageSize={PAGE_SIZE} total={data.total} label="pelanggan" onChange={setPage} />
          )}
        </>
      )}

      <CustomerFormModal
        open={formOpen}
        editing={editing}
        submitting={create.isPending || update.isPending}
        onSubmit={handleSubmit}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Hapus pelanggan?"
        description={`"${toDelete?.full_name}" akan diarsipkan (soft delete) dan dapat dipulihkan kembali.`}
        confirmLabel="Hapus"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

function CustomerFormModal({
  open,
  editing,
  submitting,
  onSubmit,
  onClose,
}: {
  open: boolean;
  editing: CustomerRow | null;
  submitting: boolean;
  onSubmit: (values: CustomerFormValues) => void;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({ resolver: zodResolver(customerSchema) });

  // Reset the form whenever the modal opens for a different record.
  useEffect(() => {
    if (open) {
      reset({
        full_name: editing?.full_name ?? '',
        whatsapp: editing?.whatsapp ?? '',
        phone: editing?.phone ?? '',
        email: editing?.email ?? '',
        address: editing?.address ?? '',
        city: editing?.city ?? '',
        notes: editing?.notes ?? '',
      });
    }
  }, [open, editing, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Ubah pelanggan' : 'Tambah pelanggan'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button form="customer-form" type="submit" loading={submitting}>Simpan</Button>
        </>
      }
    >
      <form id="customer-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Nama lengkap" required error={errors.full_name?.message}>
          <Input placeholder="Nama pelanggan" invalid={!!errors.full_name} {...register('full_name')} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="WhatsApp" error={errors.whatsapp?.message}>
            <Input placeholder="08xxxxxxxxxx" {...register('whatsapp')} />
          </Field>
          <Field label="Telepon" error={errors.phone?.message}>
            <Input placeholder="Opsional" {...register('phone')} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" placeholder="email@contoh.com" invalid={!!errors.email} {...register('email')} />
          </Field>
          <Field label="Kota" error={errors.city?.message}>
            <Input placeholder="Kota" {...register('city')} />
          </Field>
        </div>
        <Field label="Alamat" error={errors.address?.message}>
          <Textarea placeholder="Alamat lengkap" {...register('address')} />
        </Field>
        <Field label="Catatan" error={errors.notes?.message}>
          <Textarea placeholder="Catatan internal" {...register('notes')} />
        </Field>
      </form>
    </Modal>
  );
}
