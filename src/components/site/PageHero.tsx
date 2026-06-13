import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

/** Consistent header band for inner marketing pages (accounts for fixed nav). */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-site-line bg-site-paper pt-32 sm:pt-40">
      <div className="pointer-events-none absolute -right-24 -top-16 size-80 rounded-full bg-site-moss-soft blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-5 pb-14 sm:px-8">
        <Reveal>
          {eyebrow && (
            <span className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-site-clay">
              <span className="h-px w-6 bg-site-clay" />
              {eyebrow}
            </span>
          )}
          <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-tight text-site-ink sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-site-ink-soft">{description}</p>
          )}
          {children && <div className="mt-6">{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}
