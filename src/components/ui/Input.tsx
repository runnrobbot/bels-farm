import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, invalid, ...props }, ref) => (
    <div className="relative flex items-center">
      {icon && (
        <span className="pointer-events-none absolute left-3 text-muted-foreground" aria-hidden>
          {icon}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid}
        className={cn(
          'h-10 w-full rounded-md border bg-surface px-3 text-sm text-foreground',
          'placeholder:text-muted-foreground/70 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-60',
          icon && 'pl-9',
          invalid ? 'border-danger focus-visible:ring-danger/60' : 'border-input',
          className,
        )}
        {...props}
      />
    </div>
  ),
);
Input.displayName = 'Input';
