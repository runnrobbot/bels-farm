import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/app/providers';
import { router } from '@/app/routes/router';
import { Toaster } from '@/components/feedback/Toaster';
import { FullPageSpinner } from '@/components/ui/Spinner';

export function App() {
  return (
    <AppProviders>
      <Suspense fallback={<div className="grid min-h-dvh place-items-center bg-background"><FullPageSpinner /></div>}>
        <RouterProvider router={router} />
      </Suspense>
      <Toaster />
    </AppProviders>
  );
}
