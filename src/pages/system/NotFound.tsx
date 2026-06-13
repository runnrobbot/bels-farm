import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { paths } from '@/app/routes/paths';

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary-muted text-primary">
        <Compass className="size-8" />
      </span>
      <div>
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          The page you're looking for has wandered off the pasture.
        </p>
      </div>
      <Link
        to={paths.home}
        className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Return home
      </Link>
    </div>
  );
}
