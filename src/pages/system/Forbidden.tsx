import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';

export function Forbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-warning/12 text-warning">
        <ShieldOff className="size-8" />
      </span>
      <div>
        <h1 className="text-xl font-semibold text-foreground">Access restricted</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          You don't have permission to view this section. Ask a Super Admin to grant access.
        </p>
      </div>
      <Link
        to={paths.dashboard}
        className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
