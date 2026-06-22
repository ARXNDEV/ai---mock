'use client';

import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

interface CountUpProps {
  /** Final value to count to. */
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

/**
 * Counts up from 0 to `to` the first time it scrolls into view. The element
 * renders its final formatted value during SSR (and for reduced-motion users),
 * so it never shows an empty or "0" state to crawlers / no-JS visitors.
 */
export function CountUp({ to, decimals = 0, prefix = '', suffix = '', duration = 1.7, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const format = (v: number) => `${prefix}${v.toFixed(decimals)}${suffix}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce || !inView) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.2, 0.7, 0.2, 1] as [number, number, number, number],
      onUpdate: (v) => {
        el.textContent = format(v);
      },
    });
    return () => controls.stop();
    // format is derived from the same primitive deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, to, decimals, prefix, suffix, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {format(to)}
    </span>
  );
}
