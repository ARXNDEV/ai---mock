'use client';

import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

/**
 * Magnetic wrapper: the child drifts slightly toward the cursor while hovered,
 * then springs back to rest on leave. Wrap a button or link.
 *
 * Renders a plain inline-flex span under reduced-motion (no movement).
 */
export function Magnetic({
  children,
  strength = 0.35,
  className,
  style,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { stiffness: 260, damping: 18, mass: 0.4 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);

  function handleMove(e: MouseEvent<HTMLSpanElement>) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function reset() {
    x.set(0);
    y.set(0);
  }

  if (reduce) {
    return (
      <span className={className} style={{ display: 'inline-flex', ...style }}>
        {children}
      </span>
    );
  }

  return (
    <motion.span
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy, display: 'inline-flex', ...style }}
    >
      {children}
    </motion.span>
  );
}
