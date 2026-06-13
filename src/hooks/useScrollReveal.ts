import { useEffect, useRef } from 'react';
import { staggerIn } from '@/lib/animation/motion';

/**
 * Reveals direct children with a staggered entrance when the container scrolls
 * into view. Uses a single IntersectionObserver and disconnects after firing to
 * avoid leaks and re-triggering. Returns a ref to attach to the container.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  threshold?: number;
  childSelector?: string;
  once?: boolean;
}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = options?.childSelector
      ? el.querySelectorAll(options.childSelector)
      : el.children;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            staggerIn(targets);
            if (options?.once !== false) observer.disconnect();
          }
        }
      },
      { threshold: options?.threshold ?? 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.threshold, options?.childSelector, options?.once]);

  return ref;
}
