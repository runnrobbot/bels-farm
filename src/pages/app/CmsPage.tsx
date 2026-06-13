import { useState } from 'react';
import { Newspaper, FileText, MessageSquareQuote } from 'lucide-react';
import { z } from 'zod';
import { CrudListPage } from '@/components/data/CrudListPage';
import type { Column } from '@/components/data/DataTable';
import type { FieldDef } from '@/components/data/CrudFormModal';
import { Badge } from '@/components/ui/Badge';
import { createResource } from '@/lib/crud/resource';
import { createResourceHooks } from '@/lib/crud/useResource';
import { useAuth } from '@/features/auth/AuthProvider';
import { emptyToNull, cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { CmsArticleRow, ContentStatus, TestimonialRow } from '@/types/database';

const resource = createResource('cms_articles', { searchColumns: ['title', 'slug'] });
const hooks = createResourceHooks(resource, { label: 'Konten' });

const CATEGORY = [
  { value: 'article', label: 'Artikel' },
  { value: 'news', label: 'Berita' },
  { value: 'education', label: 'Edukasi' },
  { value: 'page', label: 'Halaman' },
];
const STATUS: { value: ContentStatus; label: string }[] = [
  { value: 'draft', label: 'Draf' },
  { value: 'review', label: 'Tinjau' },
  { value: 'published', label: 'Terbit' },
  { value: 'archived', label: 'Arsip' },
];
const STATUS_TONE: Record<ContentStatus, 'neutral' | 'warning' | 'success'> = {
  draft: 'neutral',
  review: 'warning',
  published: 'success',
  archived: 'neutral',
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const schema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  slug: z.string().min(3, 'Slug minimal 3 karakter').regex(/^[a-z0-9-]+$/, 'Hanya huruf kecil, angka, dan tanda hubung'),
  category: z.enum(['article', 'news', 'education', 'page']),
  status: z.enum(['draft', 'review', 'published', 'archived']),
  excerpt: z.string().optional().or(z.literal('')),
  body: z.string().optional().or(z.literal('')),
  cover_path: z.string().url('URL tidak valid').optional().or(z.literal('')),
  seo_description: z.string().max(180).optional().or(z.literal('')),
});
type Values = z.infer<typeof schema>;

const fields: FieldDef[] = [
  { name: 'title', label: 'Judul', type: 'text', required: true, full: true },
  { name: 'slug', label: 'Slug URL', type: 'text', required: true, hint: 'Contoh: tips-memilih-sapi-qurban' },
  { name: 'category', label: 'Kategori', type: 'select', options: CATEGORY },
  { name: 'status', label: 'Status', type: 'select', options: STATUS },
  { name: 'cover_path', label: 'URL gambar sampul', type: 'text', placeholder: 'https://…' },
  { name: 'excerpt', label: 'Ringkasan', type: 'textarea' },
  { name: 'body', label: 'Isi konten', type: 'textarea' },
  { name: 'seo_description', label: 'Deskripsi SEO', type: 'textarea' },
];

const columns: Column<CmsArticleRow>[] = [
  {
    key: 'title',
    header: 'Judul',
    render: (a) => (
      <div>
        <p className="font-medium text-foreground">{a.title}</p>
        <p className="font-mono text-xs text-muted-foreground">/{a.slug}</p>
      </div>
    ),
  },
  { key: 'category', header: 'Kategori', render: (a) => <span className="capitalize text-muted-foreground">{a.category}</span> },
  {
    key: 'status',
    header: 'Status',
    render: (a) => <Badge tone={STATUS_TONE[a.status]} dot>{STATUS.find((s) => s.value === a.status)?.label}</Badge>,
  },
  {
    key: 'published',
    header: 'Terbit',
    render: (a) => <span className="text-muted-foreground">{a.published_at ? format(new Date(a.published_at), 'd MMM yyyy') : '—'}</span>,
  },
];

function ArticlesTab() {
  const { profile } = useAuth();

  const publishedAt = (status: string, existing?: string | null) =>
    status === 'published' ? existing ?? new Date().toISOString() : null;

  return (
    <CrudListPage<'cms_articles', Values>
      hooks={hooks}
      permission="cms"
      label="Konten"
      title="Konten & Artikel"
      description="Kelola artikel, berita, dan edukasi yang tampil di website publik."
      icon={Newspaper}
      searchPlaceholder="Cari judul atau slug…"
      columns={columns}
      fields={fields}
      schema={schema}
      formSize="xl"
      toFormValues={(a) => ({
        title: a?.title ?? '',
        slug: a?.slug ?? '',
        category: a?.category ?? 'article',
        status: a?.status ?? 'draft',
        excerpt: a?.excerpt ?? '',
        body: a?.body ?? '',
        cover_path: a?.cover_path ?? '',
        seo_description: a?.seo_description ?? '',
      })}
      toCreate={(v) => ({
        ...emptyToNull(v),
        slug: v.slug || slugify(v.title),
        organization_id: profile?.organization_id ?? '',
        author_id: profile?.id ?? null,
        published_at: publishedAt(v.status),
        tags: [],
      })}
      toUpdate={(v) => ({
        ...emptyToNull(v),
        slug: v.slug || slugify(v.title),
        published_at: publishedAt(v.status),
      })}
      deleteText={(a) => `Konten "${a.title}" akan diarsipkan.`}
    />
  );
}

// ─────────────────────────── Testimonials ───────────────────────────
const testimonialResource = createResource('testimonials', { searchColumns: ['author_name', 'quote'] });
const testimonialHooks = createResourceHooks(testimonialResource, { label: 'Testimoni' });

const testimonialSchema = z.object({
  author_name: z.string().min(2, 'Nama wajib diisi'),
  author_role: z.string().optional().or(z.literal('')),
  quote: z.string().min(5, 'Kutipan wajib diisi'),
  rating: z.coerce.number().min(1).max(5).optional(),
  is_published: z.enum(['true', 'false']),
});
type TestimonialValues = z.infer<typeof testimonialSchema>;

const testimonialFields: FieldDef[] = [
  { name: 'author_name', label: 'Nama', type: 'text', required: true },
  { name: 'author_role', label: 'Keterangan', type: 'text', placeholder: 'mis. Pelanggan Qurban 2024' },
  { name: 'rating', label: 'Rating (1–5)', type: 'number', step: '1' },
  { name: 'is_published', label: 'Status', type: 'select', options: [
    { value: 'true', label: 'Tampilkan' },
    { value: 'false', label: 'Sembunyikan' },
  ] },
  { name: 'quote', label: 'Kutipan', type: 'textarea', required: true, full: true },
];

const testimonialColumns: Column<TestimonialRow>[] = [
  {
    key: 'author',
    header: 'Penulis',
    render: (t) => (
      <div>
        <p className="font-medium text-foreground">{t.author_name}</p>
        {t.author_role && <p className="text-xs text-muted-foreground">{t.author_role}</p>}
      </div>
    ),
  },
  { key: 'quote', header: 'Kutipan', render: (t) => <span className="line-clamp-2 text-muted-foreground">{t.quote}</span> },
  { key: 'rating', header: 'Rating', render: (t) => <span className="tabular-nums">{t.rating ? `★ ${t.rating}` : '—'}</span> },
  {
    key: 'published',
    header: 'Status',
    render: (t) => <Badge tone={t.is_published ? 'success' : 'neutral'} dot>{t.is_published ? 'Tampil' : 'Tersembunyi'}</Badge>,
  },
];

function TestimonialsTab() {
  const { profile } = useAuth();
  return (
    <CrudListPage<'testimonials', TestimonialValues>
      hooks={testimonialHooks}
      permission="cms"
      label="Testimoni"
      title="Testimoni"
      description="Kelola testimoni pelanggan yang tampil di website publik."
      icon={MessageSquareQuote}
      searchPlaceholder="Cari nama atau kutipan…"
      columns={testimonialColumns}
      fields={testimonialFields}
      schema={testimonialSchema}
      formSize="lg"
      toFormValues={(t) => ({
        author_name: t?.author_name ?? '',
        author_role: t?.author_role ?? '',
        quote: t?.quote ?? '',
        rating: t?.rating ?? 5,
        is_published: t?.is_published === false ? 'false' : 'true',
      })}
      toCreate={(v) => {
        const { is_published, ...rest } = emptyToNull(v);
        return { ...rest, is_published: is_published === 'true', organization_id: profile?.organization_id ?? '' };
      }}
      toUpdate={(v) => {
        const { is_published, ...rest } = emptyToNull(v);
        return { ...rest, is_published: is_published === 'true' };
      }}
      deleteText={(t) => `Testimoni dari "${t.author_name}" akan diarsipkan.`}
    />
  );
}

// ─────────────────────────── Tabbed page ───────────────────────────
type Tab = 'articles' | 'testimonials';
const TABS: { key: Tab; label: string; icon: typeof FileText }[] = [
  { key: 'articles', label: 'Artikel', icon: FileText },
  { key: 'testimonials', label: 'Testimoni', icon: MessageSquareQuote },
];

export default function CmsPage() {
  const [tab, setTab] = useState<Tab>('articles');
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1.5 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'articles' ? <ArticlesTab /> : <TestimonialsTab />}
    </div>
  );
}
