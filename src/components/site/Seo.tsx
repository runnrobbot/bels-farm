import { env } from '@/config/env';
import { SITE } from '@/features/marketing/site';

interface SeoProps {
  title?: string;
  description?: string;
  /** Path beginning with "/" for canonical + og:url. */
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  /** Optional JSON-LD structured data object. */
  jsonLd?: Record<string, unknown>;
}

/**
 * Per-page SEO. React 19 hoists <title>/<meta>/<link> rendered here into the
 * document <head>, so each public page can set its own title, description,
 * canonical URL, Open Graph/Twitter cards, and structured data.
 */
export function Seo({ title, description, path = '', image, type = 'website', jsonLd }: SeoProps) {
  const fullTitle = title ? `${title} — ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
  const desc = (description ?? SITE.description).slice(0, 300);
  const base = env.siteUrl.replace(/\/$/, '');
  const url = `${base}${path}`;
  const img = image ?? `${base}/logo-belsfarm.png`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:locale" content="id_ID" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </>
  );
}
