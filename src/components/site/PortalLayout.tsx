import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '@/features/auth/AuthProvider';
import { authService } from '@/features/auth/services/authService';
import { Avatar } from '@/components/ui/Avatar';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { paths } from '@/app/routes/paths';
import { SITE } from '@/features/marketing/site';
import { popIn } from '@/lib/animation/motion';
import { toast } from '@/stores/toastStore';

/** Layout for the authenticated customer self-service portal. */
export function PortalLayout() {
  const { profile, session } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const name = profile?.full_name || session?.user.email || 'Pelanggan';

  useEffect(() => {
    if (!menuOpen) return;
    if (menuRef.current) popIn(menuRef.current);
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const signOut = async () => {
    try {
      await authService.signOut();
      void navigate(paths.home);
    } catch (error) {
      toast.fromError(error, 'Gagal keluar');
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-site-cream font-sans text-site-ink">
      <header className="border-b border-site-line bg-site-paper">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link to={paths.portalQurban} className="flex items-center gap-2.5">
            <Logo height={40} />
            <span className="font-serif text-lg font-semibold tracking-tight">{SITE.name}</span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-site-line bg-site-cream py-1 pl-1 pr-2.5 transition-colors hover:bg-site-sand"
            >
              <Avatar name={name} size="sm" />
              <span className="hidden text-sm font-medium sm:block">{name.split(' ')[0]}</span>
              <ChevronDown className="size-4 text-site-ink-soft" />
            </button>

            {menuOpen && (
              <div ref={menuRef} className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-xl border border-site-line bg-site-paper p-1.5 shadow-xl">
                <div className="px-2.5 py-2">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="truncate text-2xs text-site-ink-soft">{session?.user.email}</p>
                </div>
                <div className="my-1 h-px bg-site-line" />
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-site-clay-dark hover:bg-site-clay/10"
                >
                  <LogOut className="size-4" /> Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8">
        <ErrorBoundary>
          <Suspense fallback={<FullPageSpinner />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
