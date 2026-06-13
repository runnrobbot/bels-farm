import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useArticle } from '@/features/marketing/hooks';
import { Pill } from '@/features/marketing/components/shared';
import { paths } from '@/app/routes/paths';
import { format } from 'date-fns';

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading } = useArticle(slug);

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-5 pt-40 sm:px-8"><div className="h-96 animate-pulse rounded-2xl bg-site-sand/60" /></div>;
  }

  if (!article) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 pt-44 text-center sm:px-8">
        <h1 className="font-serif text-3xl font-semibold text-site-ink">Artikel tidak ditemukan</h1>
        <Link to={paths.articles} className="mt-6 inline-flex items-center gap-2 rounded-full bg-site-moss px-6 py-3 text-sm font-medium text-site-paper">
          <ArrowLeft className="size-4" /> Semua artikel
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
      <Link to={paths.articles} className="inline-flex items-center gap-1.5 text-sm text-site-ink-soft transition-colors hover:text-site-ink">
        <ArrowLeft className="size-4" /> Artikel
      </Link>

      <div className="mt-6">
        <Pill tone="sand">{article.category}</Pill>
        <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight tracking-tight text-site-ink">
          {article.title}
        </h1>
        {article.published_at && (
          <p className="mt-3 text-sm text-site-ink-soft">
            {format(new Date(article.published_at), 'd MMMM yyyy')}
          </p>
        )}
      </div>

      {article.cover_path && (
        <img src={article.cover_path} alt={article.title} className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover" />
      )}

      {article.excerpt && (
        <p className="mt-8 border-l-2 border-site-clay pl-4 font-serif text-xl leading-relaxed text-site-ink">
          {article.excerpt}
        </p>
      )}

      {/* Body is stored as plain text/markdown; render paragraphs preserving breaks. */}
      <div className="mt-8 space-y-4 leading-relaxed text-site-ink-soft">
        {(article.body ?? '').split(/\n{2,}/).filter(Boolean).map((para, i) => (
          <p key={i} className="whitespace-pre-line">{para}</p>
        ))}
      </div>
    </article>
  );
}
