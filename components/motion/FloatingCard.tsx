'use client';

import {
  motion,
  useReducedMotion,
  useSpring,
  useTime,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import type { ReactNode } from 'react';

interface FloatingCardProps {
  /** Normalized pointer position (-1..1) shared by the parent section. */
  mx: MotionValue<number>;
  my: MotionValue<number>;
  /** Parallax travel in px at the screen edge. Higher = nearer the viewer. */
  depth?: number;
  /** Idle float amplitude in px. */
  floatRange?: number;
  /** One float cycle in ms — vary per card so they drift independently. */
  floatDuration?: number;
  rotate?: number;
  className?: string;
  children: ReactNode;
}

/**
 * A card that idly bobs (independent speed per card) and parallax-shifts toward
 * the cursor. Float + parallax are summed on one motion value so a single
 * transform drives the GPU — no layout thrash, no competing animations.
 */
export function FloatingCard({
  mx,
  my,
  depth = 16,
  floatRange = 10,
  floatDuration = 7000,
  rotate = 0,
  className,
  children,
}: FloatingCardProps) {
  const reduce = useReducedMotion();
  const time = useTime();
  const spring = { stiffness: 120, damping: 20, mass: 0.6 };

  const floatY = useTransform(time, (t) =>
    reduce ? 0 : Math.sin((t / floatDuration) * Math.PI * 2) * floatRange,
  );
  const parallaxX = useSpring(
    useTransform(mx, (v) => (reduce ? 0 : v * depth)),
    spring,
  );
  const parallaxY = useSpring(
    useTransform(my, (v) => (reduce ? 0 : v * depth)),
    spring,
  );
  const y = useTransform([floatY, parallaxY], ([f, p]) => (f as number) + (p as number));

  return (
    <motion.div className={className} style={{ x: parallaxX, y, rotate }}>
      {children}
    </motion.div>
  );
}
