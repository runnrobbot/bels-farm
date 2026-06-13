import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { LiveChat } from './LiveChat';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

/**
 * Shell for the public marketing site. Owns its own warm palette (the `site-*`
 * tokens) independent of the dark/light app theme.
 */
export function SiteLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-site-cream font-sans text-site-ink antialiased">
      <ScrollToTop />
      <SiteHeader />
      <main className="flex-1">
        <ErrorBoundary>
          <Suspense fallback={<div className="h-dvh" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <SiteFooter />
      <LiveChat />
    </div>
  );
}
