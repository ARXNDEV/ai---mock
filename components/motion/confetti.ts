// Lightweight confetti built on the Web Animations API — transform + opacity
// only (GPU-friendly), self-removing, no dependencies. Shared by the landing
// click-celebration and the interview results screen.

const COLORS = ['#E5402B', '#F0573B', '#B0741A', '#2E6B4B', '#1A1712'];

function prefersReduced(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function makePiece(x: number, y: number): HTMLDivElement {
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
  anim.onfinish = () => el.remove();
  return el;
}

/** Spawn a single burst (ring pulse + confetti) into an existing overlay layer. */
export function burstAt(layer: HTMLElement, x: number, y: number, count = 14): void {
  if (prefersReduced()) return;

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

  for (let i = 0; i < count; i += 1) layer.appendChild(makePiece(x, y));
}

/**
 * One-shot celebration: creates a temporary fullscreen overlay, fires one or
 * more bursts near the top-center, then cleans itself up. Use for "you did it"
 * moments (e.g. finishing an interview). No-op under reduced motion / SSR.
 */
export function fireConfetti(opts: { x?: number; y?: number; count?: number; bursts?: number } = {}): void {
  if (typeof window === 'undefined' || prefersReduced()) return;
  const { count = 18, bursts = 1 } = opts;

  const layer = document.createElement('div');
  Object.assign(layer.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '9998',
    pointerEvents: 'none',
    overflow: 'hidden',
  });
  document.body.appendChild(layer);

  for (let b = 0; b < bursts; b += 1) {
    setTimeout(() => {
      const x = opts.x ?? window.innerWidth * (0.35 + Math.random() * 0.3);
      const y = opts.y ?? window.innerHeight * (0.25 + Math.random() * 0.15);
      burstAt(layer, x, y, count);
    }, b * 180);
  }

  setTimeout(() => layer.remove(), 1600 + bursts * 180);
}
