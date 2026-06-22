'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

// Warm, on-brand confetti palette (accent → ochre → green → ink).
const COLORS = ['#E5402B', '#F0573B', '#B0741A', '#2E6B4B', '#1A1712'];
const PIECES = 14;

/**
 * Confetti burst at the click point — a quick accent ring pulse plus a spray of
 * tumbling pieces that fall under a little gravity. Built on the Web Animations
 * API (transform + opacity only, GPU-friendly, self-removing) so it's reliable
 * and cheap even on rapid clicks. Skipped entirely under reduced motion.
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
      burst(layer, e.clientX, e.clientY);
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

function makePiece(x: number, y: number): { el: HTMLDivElement; anim: Animation } {
  const angle = Math.random() * Math.PI * 2;
  const dist = 42 + Math.random() * 78;
  const dx = Math.cos(angle) * dist;
  const dy = Math.sin(angle) * dist - 24; // launch up a touch before gravity
  const size = 6 + Math.random() * 6;
  const isRect = Math.random() > 0.5;
  const rotate = (Math.random() - 0.5) * 540;
  const duration = 750 + Math.random() * 350;

  const el = document.createElement('div');
  Object.assign(el.style, {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${size}px`,
    height: `${isRect ? size * 0.5 : size}px`,
    marginLeft: `${-size / 2}px`,
    marginTop: `${-size / 2}px`,
    borderRadius: isRect ? '2px' : '50%',
    background: COLORS[Math.floor(Math.random() * COLORS.length)],
    willChange: 'transform, opacity',
  });

  const anim = el.animate(
    [
      { transform: 'translate(0px, 0px) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy + 70}px) scale(0.4) rotate(${rotate}deg)`, opacity: 0 },
    ],
    { duration, easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)', fill: 'forwards' },
  );
  return { el, anim };
}

function burst(layer: HTMLDivElement, x: number, y: number) {
  // Ring pulse
  const ring = document.createElement('div');
  Object.assign(ring.style, {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: '38px',
    height: '38px',
    marginLeft: '-19px',
    marginTop: '-19px',
    borderRadius: '50%',
    border: '2px solid var(--accent)',
    willChange: 'transform, opacity',
  });
  layer.appendChild(ring);
  const ringAnim = ring.animate(
    [
      { transform: 'scale(0)', opacity: 0.55 },
      { transform: 'scale(2.6)', opacity: 0 },
    ],
    { duration: 500, easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)', fill: 'forwards' },
  );
  ringAnim.onfinish = () => ring.remove();

  // Confetti pieces
  for (let i = 0; i < PIECES; i += 1) {
    const { el, anim } = makePiece(x, y);
    layer.appendChild(el);
    anim.onfinish = () => el.remove();
  }
}
