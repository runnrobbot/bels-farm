/**
 * Vercel serverless function: dynamic XML sitemap.
 *
 * Combines the static public marketing routes with every published article
 * slug from `cms_articles`. The base URL is derived from the request host so
 * the same code works on preview and production domains.
 *
 * Env (optional): SUPABASE_URL + SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 * to include article URLs. Falls back to VITE_-prefixed vars for local dev.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  '';

// Static public routes with crawl priority hints.
const STATIC_ROUTES: { path: string; priority: string; changefreq: string }[] = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/catalog', priority: '0.9', changefreq: 'daily' },
  { path: '/qurban', priority: '0.9', changefreq: 'weekly' },
  { path: '/gallery', priority: '0.6', changefreq: 'weekly' },
  { path: '/articles', priority: '0.7', changefreq: 'weekly' },
  { path: '/testimonials', priority: '0.5', changefreq: 'monthly' },
  { path: '/faq', priority: '0.5', changefreq: 'monthly' },
  { path: '/contact', priority: '0.6', changefreq: 'monthly' },
];

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req: any, res: any) {
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
  const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.headers.host ?? '';
  const base = `${proto}://${host}`.replace(/\/$/, '');

  const urls: { loc: string; priority: string; changefreq: string; lastmod?: string }[] =
    STATIC_ROUTES.map((r) => ({ loc: `${base}${r.path}`, priority: r.priority, changefreq: r.changefreq }));

  // Append published articles when Supabase is configured.
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const client = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
      const { data } = await client
        .from('cms_articles')
        .select('slug, published_at, updated_at')
        .eq('status', 'published')
        .is('deleted_at', null)
        .order('published_at', { ascending: false });
      for (const row of (data ?? []) as { slug: string; published_at: string | null; updated_at: string | null }[]) {
        if (!row.slug) continue;
        urls.push({
          loc: `${base}/articles/${row.slug}`,
          priority: '0.6',
          changefreq: 'monthly',
          lastmod: (row.updated_at ?? row.published_at ?? undefined) || undefined,
        });
      }
    } catch {
      // Sitemap should still serve the static routes if the DB query fails.
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => {
    const lastmod = u.lastmod ? `\n    <lastmod>${xmlEscape(new Date(u.lastmod).toISOString())}</lastmod>` : '';
    return `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>${lastmod}\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`;
  })
  .join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(body);
}
