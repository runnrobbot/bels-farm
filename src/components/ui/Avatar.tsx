import { cn, initials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'size-7 text-2xs',
  md: 'size-9 text-xs',
  lg: 'size-12 text-sm',
} as const;

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-primary-muted font-semibold text-primary ring-1 ring-border',
        SIZES[size],
        className,
      )}
      aria-hidden={!name}
    >
      {src ? (
        <img src={src} alt={name} loading="lazy" decoding="async" className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
