import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/animation/motion';

/**
 * Subtle scroll parallax: translates the element vertically as it moves through
 * the viewport. `speed` < 0 drifts up (slower than scroll), > 0 drifts down.
 * rAF-throttled and disabled for reduced-motion users.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(speed = -0.12) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const offset = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${(offset * speed).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [speed]);

  return ref;
}
