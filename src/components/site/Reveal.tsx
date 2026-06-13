import { useEffect, useRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import { anime, prefersReducedMotion } from '@/lib/animation/motion';
import { cn } from '@/lib/utils';

type Variant = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in ms before the entrance plays once in view. */
  delay?: number;
  /** Entrance style — vary it across sections so the site doesn't feel uniform. */
  variant?: Variant;
  /** Animate direct children in a stagger instead of the container as a whole. */
  stagger?: boolean;
  /** Stagger step (ms) between children. */
  staggerStep?: number;
  as?: ElementType;
}

const FROM: Record<Variant, Record<string, [number, number] | number[]>> = {
  up: { translateY: [36, 0] },
  down: { translateY: [-36, 0] },
  left: { translateX: [-48, 0] },
  right: { translateX: [48, 0] },
  scale: { scale: [0.9, 1] },
  fade: {},
};

/**
 * Scroll-reveal with multiple motion variants (directional slide, scale) and an
 * optional child stagger. Uses one IntersectionObserver, fires once, and honors
 * reduced-motion. Mix variants across sections for a lively-but-cohesive feel.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = 'up',
  stagger = false,
  staggerStep = 90,
  as: Tag = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = stagger ? Array.from(el.children) : el;
    const nodes = stagger ? (targets as Element[]) : [el];

    if (prefersReducedMotion()) {
      nodes.forEach((n) => ((n as HTMLElement).style.opacity = '1'));
      return;
    }
    nodes.forEach((n) => ((n as HTMLElement).style.opacity = '0'));

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            anime({
              targets,
              opacity: [0, 1],
              ...FROM[variant],
              duration: 720,
              delay: stagger ? anime.stagger(staggerStep, { start: delay }) : delay,
              easing: 'cubicBezier(0.16, 1, 0.3, 1)',
            });
            obs.disconnect();
          }
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, variant, stagger, staggerStep]);

  return (
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  );
}
