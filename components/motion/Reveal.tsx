'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

const EASE: [number, number, number, number] = [0.2, 0.7, 0.2, 1];

/** Child variant: fade up + translateY. Shared by every staggered element. */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/**
 * Reveal-on-scroll container with staggered children. Renders a plain div when
 * the user prefers reduced motion (children appear instantly, fully visible).
 *
 * Wrap children in <RevealItem> — or any `motion` element carrying `fadeUpItem`
 * — to get the staggered entrance.
 */
export function Reveal({
  children,
  className,
  style,
  stagger = 0.09,
  amount = 0.2,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  stagger?: number;
  amount?: number;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

/** A single staggered child. Plain div under reduced-motion. */
export function RevealItem({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div className={className} style={style} variants={fadeUpItem}>
      {children}
    </motion.div>
  );
}
