import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, ArrowUpRight } from 'lucide-react';
import { PageHero } from '@/components/site/PageHero';
import { Reveal } from '@/components/site/Reveal';
import { Seo } from '@/components/site/Seo';
import { useArticles } from '@/features/marketing/hooks';
import { Pill } from '@/features/marketing/components/shared';
import { paths } from '@/app/routes/paths';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { CmsArticleRow } from '@/types/database';

const CATEGORIES: { key: CmsArticleRow['category'] | 'all'; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'article', label: 'Artikel' },
  { key: 'news', label: 'Berita' },
  { key: 'education', label: 'Edukasi' },
];

export default function ArticlesPage() {
  const [category, setCategory] = useState<CmsArticleRow['category'] | 'all'>('all');
  const { data: articles = [], isLoading } = useArticles(category === 'all' ? undefined : category);

  return (
    <>
      <Seo
        title="Artikel & Edukasi Peternakan"
        description="Tips memilih, merawat, dan memahami ternak sapi, kambing, dan domba dari BELS FARM."
        path="/articles"
      />
      <PageHero
        eyebrow="Artikel & Edukasi"
        title="Wawasan seputar peternakan"
        description="Tips memilih, merawat, dan memahami ternak sapi, kambing, dan domba."
      />

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="mb-10 flex">
          <div className="inline-flex max-w-full flex-wrap gap-1 rounded-full border border-site-line bg-site-paper p-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                  category === c.key
                    ? 'bg-site-moss text-site-paper shadow-sm'
                    : 'text-site-ink-soft hover:bg-site-moss-soft hover:text-site-ink',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-site-sand/60" />
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a, i) => (
              <Reveal key={a.id} delay={Math.min(i, 6) * 70}>
                <Link
                  to={paths.article(a.slug)}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-site-line bg-site-paper transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  {a.cover_path ? (
                    <img src={a.cover_path} alt={a.title} loading="lazy" className="aspect-[16/10] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-site-moss-soft to-site-sand">
                      <Newspaper className="size-10 text-site-moss/40" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <Pill tone="sand">{a.category}</Pill>
                    <h3 className="mt-3 font-serif text-xl font-semibold leading-snug text-site-ink group-hover:text-site-moss-dark">
                      {a.title}
                    </h3>
                    {a.excerpt && <p className="mt-2 line-clamp-3 text-sm text-site-ink-soft">{a.excerpt}</p>}
                    <div className="mt-auto flex items-center justify-between pt-5 text-xs text-site-ink-soft">
                      <span>{a.published_at ? format(new Date(a.published_at), 'd MMM yyyy') : ''}</span>
                      <ArrowUpRight className="size-4 text-site-moss" />
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-site-line bg-site-paper p-14 text-center">
            <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-site-moss-soft text-site-moss">
              <Newspaper className="size-7" />
            </span>
            <h3 className="font-serif text-xl font-semibold text-site-ink">Belum ada artikel</h3>
            <p className="mx-auto mt-2 max-w-md text-site-ink-soft">
              Artikel dan tips peternakan akan segera kami terbitkan di sini.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
