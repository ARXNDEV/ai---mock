'use client';

import { useEffect, useState } from 'react';

const R = 70;
const CIRC = 2 * Math.PI * R;

export function ScoreRing({ score }: { score: number | null }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (score == null) {
      setVal(0);
      return;
    }
    let raf = 0;
    const dur = 1100;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setVal(score * eased);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const offset = CIRC * (1 - val / 10);

  return (
    <div className="ring-center-wrap">
      <div className="ring-wrap">
        <svg width="166" height="166" viewBox="0 0 166 166">
          <circle cx="83" cy="83" r="70" fill="none" stroke="rgba(240,236,227,0.14)" strokeWidth="4" />
          <defs>
            <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#F0573B" />
              <stop offset="1" stopColor="#E5402B" />
            </linearGradient>
          </defs>
          <circle
            cx="83"
            cy="83"
            r="70"
            fill="none"
            stroke="url(#rg)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="ring-center">
          <div className="rv num">
            {score == null ? '—' : val.toFixed(1)}
            <span>/10</span>
          </div>
          <div className="rl">{score == null ? 'Awaiting answer' : 'Current score'}</div>
        </div>
      </div>
    </div>
  );
}
