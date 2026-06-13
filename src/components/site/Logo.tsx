import { useState } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** Rendered height in pixels; width scales automatically to keep aspect ratio. */
  height?: number;
  /** Max width guard so a very wide logotype doesn't overflow its container. */
  maxWidth?: number;
  className?: string;
}

/**
 * Brand logo. Renders /public/logo-belsfarm.png sized by height (width auto, so
 * non-square logos aren't shrunk into a tiny box). Falls back to a hand-drawn
 * mark until the image exists.
 */
export function Logo({ height = 40, maxWidth = 200, className }: LogoProps) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <img
        src="/logo-belsfarm.png"
        alt="BELS FARM"
        style={{ height, width: 'auto', maxWidth }}
        className={cn('object-contain', className)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      style={{ height, width: height }}
      className={cn(
        'inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground',
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[62%]" fill="none">
        <path
          d="M6 9C4.5 7.5 4 5.5 4.6 4c1.8.2 3.2 1.4 3.9 3M18 9c1.5-1.5 2-3.5 1.4-5-1.8.2-3.2 1.4-3.9 3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M12 7.5c3 0 5 2 5 5 0 3.2-2.4 6-5 6s-5-2.8-5-6c0-3 2-5 5-5Z"
          fill="currentColor"
          opacity="0.95"
        />
      </svg>
    </span>
  );
}
