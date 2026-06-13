import { Truck, MessageCircle } from 'lucide-react';
import { z } from 'zod';
import { CrudListPage } from '@/components/data/CrudListPage';
import type { Column } from '@/components/data/DataTable';
import type { FieldDef } from '@/components/data/CrudFormModal';
import { createResource } from '@/lib/crud/resource';
import { createResourceHooks } from '@/lib/crud/useResource';
import { useAuth } from '@/features/auth/AuthProvider';
import { emptyToNull, whatsappLink } from '@/lib/utils';
import type { SupplierRow } from '@/types/database';

const resource = createResource('suppliers', {
  searchColumns: ['name', 'contact_name', 'phone', 'whatsapp', 'email'],
});
const hooks = createResourceHooks(resource, { label: 'Pemasok' });

const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  contact_name: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});
type Values = z.infer<typeof schema>;

const fields: FieldDef[] = [
  { name: 'name', label: 'Nama pemasok', type: 'text', required: true, placeholder: 'CV / Nama' },
  { name: 'contact_name', label: 'Nama kontak', type: 'text', placeholder: 'PIC' },
  { name: 'phone', label: 'Telepon', type: 'text' },
  { name: 'whatsapp', label: 'WhatsApp', type: 'text', placeholder: '08xxxxxxxxxx' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'address', label: 'Alamat', type: 'textarea' },
  { name: 'notes', label: 'Catatan', type: 'textarea' },
];

const columns: Column<SupplierRow>[] = [
  {
    key: 'name',
    header: 'Pemasok',
    render: (s) => (
      <div>
        <p className="font-medium text-foreground">{s.name}</p>
        {s.contact_name && <p className="text-xs text-muted-foreground">{s.contact_name}</p>}
      </div>
    ),
  },
  { key: 'phone', header: 'Telepon', render: (s) => s.phone || s.whatsapp || '—' },
  { key: 'email', header: 'Email', render: (s) => <span className="text-muted-foreground">{s.email || '—'}</span> },
];

export default function SuppliersPage() {
  const { profile } = useAuth();

  return (
    <CrudListPage<'suppliers', Values>
      hooks={hooks}
      permission="supplier"
      label="Pemasok"
      title="Pemasok"
      description="Kelola data pemasok pakan, obat, dan perlengkapan."
      icon={Truck}
      searchPlaceholder="Cari pemasok…"
      columns={columns}
      fields={fields}
      schema={schema}
      toFormValues={(s) => ({
        name: s?.name ?? '',
        contact_name: s?.contact_name ?? '',
        phone: s?.phone ?? '',
        whatsapp: s?.whatsapp ?? '',
        email: s?.email ?? '',
        address: s?.address ?? '',
        notes: s?.notes ?? '',
      })}
      toCreate={(v) => ({ ...emptyToNull(v), organization_id: profile?.organization_id ?? '' })}
      toUpdate={(v) => emptyToNull(v)}
      deleteText={(s) => `"${s.name}" akan diarsipkan dan dapat dipulihkan.`}
      rowActions={(s) =>
        s.whatsapp ? (
          <a
            href={whatsappLink(s.whatsapp, `Halo ${s.name}, dari BELS FARM.`)}
            target="_blank"
            rel="noreferrer"
            className="flex size-8 items-center justify-center rounded-md text-[#25D366] transition-colors hover:bg-muted"
            aria-label="WhatsApp"
          >
            <MessageCircle className="size-4" />
          </a>
        ) : null
      }
    />
  );
}
