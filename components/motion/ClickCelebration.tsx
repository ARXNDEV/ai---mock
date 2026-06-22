'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { burstAt } from './confetti';

/**
 * Confetti burst at the click point — fires on every primary click anywhere on
 * the page via a single persistent, pointer-events-none overlay. Skipped under
 * reduced motion. The burst itself lives in ./confetti (shared with results).
 */
export function ClickCelebration() {
  const reduce = useReducedMotion();
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce) return;
    const layer = layerRef.current;
    if (!layer) return;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // primary click / tap only
      burstAt(layer, e.clientX, e.clientY);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [reduce]);

  if (reduce) return null;

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none', overflow: 'hidden' }}
    />
  );
}
