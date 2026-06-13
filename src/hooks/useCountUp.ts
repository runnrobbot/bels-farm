import { useEffect, useRef, useState } from 'react';
import { countTo } from '@/lib/animation/motion';

/**
 * Animates a number from its previous value to `value` whenever it changes.
 * Cancels any in-flight animation to prevent overlapping updates / jank.
 */
export function useCountUp(value: number, options?: { duration?: number }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(0);

  useEffect(() => {
    const animation = countTo(previous.current, value, setDisplay, options);
    previous.current = value;
    return () => {
      animation?.pause();
    };
  }, [value, options]);

  return display;
}
