'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

// Elements that make the ring expand (anything clickable / interactive).
const INTERACTIVE = 'a, button, [role="button"], .btn, .clip, .feature, .price-card, .price-toggle button, input, textarea, select';

/**
 * Premium custom cursor: a precise accent dot that tracks 1:1 plus a larger
 * ring that trails with a spring. The ring expands and the dot shrinks over
 * interactive elements; both nudge in on click.
 *
 * Only activates on fine-pointer + hover devices (desktop mouse) and bows out
 * for touch screens and `prefers-reduced-motion`, restoring the native cursor.
 * Scoped to the landing page, which has no text fields to lose the caret on.
 */
export function CustomCursor() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [down, setDown] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 350, damping: 28, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 350, damping: 28, mass: 0.5 });

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    setEnabled(fine && !reduce);
  }, [reduce]);

  useEffect(() => {
    if (!enabled) return;
    document.body.classList.add('custom-cursor-active');

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: MouseEvent) => {
      const target = e.target as Element | null;
      setHovering(Boolean(target?.closest?.(INTERACTIVE)));
    };
    const onDown = () => setDown(true);
    const onUp = () => setDown(false);

    window.addEventListener('mousemove', move, { passive: true });
    window.addEventListener('mouseover', over, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    return () => {
      document.body.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const spring = { type: 'spring' as const, stiffness: 320, damping: 22 };

  return (
    <>
      {/* Trailing ring */}
      <motion.div
        aria-hidden="true"
        style={{ position: 'fixed', top: 0, left: 0, x: ringX, y: ringY, zIndex: 9999, pointerEvents: 'none' }}
      >
        <motion.div
          animate={{ scale: (hovering ? 1.7 : 1) * (down ? 0.85 : 1) }}
          transition={spring}
          style={{
            width: 34,
            height: 34,
            marginLeft: -17,
            marginTop: -17,
            borderRadius: '50%',
            border: '1.5px solid rgba(229, 64, 43, 0.5)',
            background: hovering ? 'rgba(229, 64, 43, 0.08)' : 'rgba(229, 64, 43, 0)',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
        />
      </motion.div>

      {/* Precise dot */}
      <motion.div
        aria-hidden="true"
        style={{ position: 'fixed', top: 0, left: 0, x, y, zIndex: 9999, pointerEvents: 'none' }}
      >
        <motion.div
          animate={{ scale: down ? 0.6 : hovering ? 0.45 : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            width: 8,
            height: 8,
            marginLeft: -4,
            marginTop: -4,
            borderRadius: '50%',
            background: 'var(--accent)',
          }}
        />
      </motion.div>
    </>
  );
}
