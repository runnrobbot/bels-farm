import anime from 'animejs';

/**
 * Shared anime.js motion primitives.
 *
 * Centralizing easings/durations keeps animations consistent and makes it easy
 * to honor `prefers-reduced-motion` in one place. Every helper short-circuits to
 * a no-op (final state applied instantly) when the user prefers reduced motion.
 */

export const EASING = {
  spring: 'cubicBezier(0.16, 1, 0.3, 1)',
  smooth: 'cubicBezier(0.4, 0, 0.2, 1)',
  out: 'easeOutCubic',
} as const;

export const DURATION = {
  fast: 180,
  base: 320,
  slow: 560,
} as const;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

type Target = NonNullable<anime.AnimeParams['targets']>;

/** Staggered entrance for lists/grids/table rows. */
export function staggerIn(targets: Target, options?: { delay?: number; y?: number }) {
  if (prefersReducedMotion()) {
    return anime.set(targets, { opacity: 1, translateY: 0 });
  }
  return anime({
    targets,
    opacity: [0, 1],
    translateY: [options?.y ?? 14, 0],
    duration: DURATION.base,
    easing: EASING.spring,
    delay: anime.stagger(options?.delay ?? 45),
  });
}

/** Scale + fade entrance for cards/modals/popovers. */
export function popIn(targets: Target) {
  if (prefersReducedMotion()) return anime.set(targets, { opacity: 1, scale: 1 });
  return anime({
    targets,
    opacity: [0, 1],
    scale: [0.96, 1],
    duration: DURATION.fast,
    easing: EASING.spring,
  });
}

/** Animated numeric counter; calls `onUpdate` with the interpolated value. */
export function countTo(
  from: number,
  to: number,
  onUpdate: (value: number) => void,
  options?: { duration?: number },
) {
  if (prefersReducedMotion()) {
    onUpdate(to);
    return;
  }
  const obj = { value: from };
  return anime({
    targets: obj,
    value: to,
    round: 1,
    duration: options?.duration ?? DURATION.slow,
    easing: EASING.out,
    update: () => onUpdate(obj.value),
  });
}

/** Expand/collapse height transition (e.g. accordions, sidebar groups). */
export function expandHeight(el: HTMLElement, expanded: boolean) {
  if (prefersReducedMotion()) {
    el.style.height = expanded ? 'auto' : '0px';
    el.style.opacity = expanded ? '1' : '0';
    return;
  }
  const target = expanded ? el.scrollHeight : 0;
  return anime({
    targets: el,
    height: target,
    opacity: expanded ? [0, 1] : [1, 0],
    duration: DURATION.base,
    easing: EASING.spring,
    complete: () => {
      if (expanded) el.style.height = 'auto';
    },
  });
}

/** Continuous gentle floating loop (e.g. hero accents). No-op if reduced motion. */
export function float(targets: Target, distance = 12, duration = 2800) {
  if (prefersReducedMotion()) return;
  return anime({
    targets,
    translateY: [0, -distance],
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
    duration,
  });
}

export { anime };
