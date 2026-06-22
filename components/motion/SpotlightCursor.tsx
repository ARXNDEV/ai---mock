'use client';

import { useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

/**
 * A very subtle radial spotlight that trails the cursor, tinted with the brand
 * accent at extremely low opacity so it blends into the paper background.
 * Fixed, pointer-events-none, and disabled entirely under reduced-motion.
 */
export function SpotlightCursor() {
  const reduce = useReducedMotion();
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  // Gentle trailing lag so it feels alive rather than glued to the pointer.
  const sx = useSpring(x, { stiffness: 120, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 120, damping: 22, mass: 0.6 });
  const background = useMotionTemplate`radial-gradient(440px circle at ${sx}px ${sy}px, rgba(229, 64, 43, 0.06), transparent 70%)`;

  useEffect(() => {
    if (reduce) return;
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, [reduce, x, y]);

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 8,
        pointerEvents: 'none',
        background,
      }}
    />
  );
}
