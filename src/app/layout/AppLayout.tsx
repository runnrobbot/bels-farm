import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { useUiStore } from '@/stores/uiStore';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

/**
 * Authenticated application shell. Houses the persistent sidebar/topbar and a
 * Suspense + ErrorBoundary wrapped outlet so lazy route chunks stream in and
 * route-level crashes stay contained.
 */
export function AppLayout() {
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNav = useUiStore((s) => s.setMobileNav);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden',
          mobileNavOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-black/40 transition-opacity duration-300',
            mobileNavOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setMobileNav(false)}
        />
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-64 transition-transform duration-300 ease-spring',
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <Sidebar />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
            <ErrorBoundary>
              <Suspense fallback={<FullPageSpinner />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
