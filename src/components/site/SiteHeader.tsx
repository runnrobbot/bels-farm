import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { SITE, SITE_NAV } from '@/features/marketing/site';
import { paths } from '@/app/routes/paths';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

/** Public site header: transparent over the hero, solid once scrolled. */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-colors duration-300',
        scrolled ? 'border-b border-site-line bg-site-paper/90 backdrop-blur-md' : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link to={paths.home} className="flex items-center gap-2.5" aria-label={SITE.name}>
          <Logo height={44} />
          <span className="font-serif text-xl font-semibold tracking-tight text-site-ink">
            {SITE.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {SITE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === paths.home}
              className={({ isActive }) =>
                cn(
                  'relative text-sm font-medium text-site-ink-soft transition-colors hover:text-site-ink',
                  isActive && 'text-site-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-site-clay" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to={paths.login}
            className="hidden items-center gap-1.5 rounded-full bg-site-moss px-5 py-2.5 text-sm font-medium text-site-paper transition-colors hover:bg-site-moss-dark sm:inline-flex"
          >
            Masuk <ArrowUpRight className="size-4" />
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex size-10 items-center justify-center rounded-full text-site-ink transition-colors hover:bg-site-sand lg:hidden"
            aria-label="Buka menu"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-site-line bg-site-paper px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {SITE_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === paths.home}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-site-moss-soft text-site-moss-dark' : 'text-site-ink-soft hover:bg-site-sand',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to={paths.login}
              className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-site-moss px-5 py-3 text-sm font-medium text-site-paper"
            >
              Masuk <ArrowUpRight className="size-4" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
