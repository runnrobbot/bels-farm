import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Editorial section heading with an optional eyebrow + side action. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  align?: 'left' | 'center';
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <span className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-site-clay">
            <span className="h-px w-6 bg-site-clay" />
            {eyebrow}
          </span>
        )}
        <h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-site-ink sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-base leading-relaxed text-site-ink-soft">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Pill/badge used for tags and species chips. */
export function Pill({
  children,
  tone = 'moss',
  className,
}: {
  children: ReactNode;
  tone?: 'moss' | 'clay' | 'sand';
  className?: string;
}) {
  const tones = {
    moss: 'bg-site-moss-soft text-site-moss-dark',
    clay: 'bg-site-clay/12 text-site-clay-dark',
    sand: 'bg-site-sand text-site-ink-soft',
  } as const;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  );
}

/** Primary / secondary link buttons in the site palette. */
export function SiteButton({
  to,
  href,
  children,
  variant = 'primary',
  className,
}: {
  to?: string;
  href?: string;
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'clay';
  className?: string;
}) {
  const styles = {
    primary: 'bg-site-moss text-site-paper hover:bg-site-moss-dark',
    clay: 'bg-site-clay text-site-paper hover:bg-site-clay-dark',
    outline: 'border border-site-moss/30 text-site-ink hover:bg-site-moss-soft',
  } as const;
  const cls = cn(
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors',
    styles[variant],
    className,
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to ?? '#'} className={cls}>
      {children}
    </Link>
  );
}
