import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toAppError } from '@/lib/errors';
import { env } from '@/config/env';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * App-level error boundary. Catches render-time crashes so a single broken
 * widget can't take down the whole shell. In production this is where you'd
 * forward to an error-reporting service (Sentry et al.).
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    if (env.isDev) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  reset = () => this.setState({ error: null });

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);

    const appError = toAppError(error);
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger">
          <AlertOctagon className="size-7" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Something broke</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{appError.message}</p>
        </div>
        <Button variant="outline" onClick={this.reset}>
          <RotateCcw className="size-4" /> Try again
        </Button>
      </div>
    );
  }
}
