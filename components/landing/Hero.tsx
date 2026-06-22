'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMotionValue } from 'framer-motion';
import { DemoModal } from './DemoModal';
import { FloatingCard } from '@/components/motion/FloatingCard';
import { Magnetic } from '@/components/motion/Magnetic';
import { CountUp } from '@/components/motion/CountUp';

export function Hero() {
  const [demoOpen, setDemoOpen] = useState(false);

  // Normalized pointer (-1..1), shared by the floating cards for parallax.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    mx.set((e.clientX / window.innerWidth) * 2 - 1);
    my.set((e.clientY / window.innerHeight) * 2 - 1);
  }

  return (
    <section className="hero" id="top" onMouseMove={handleMouseMove}>
      <div className="hero-grid">
        <div>
          <div className="hero-badge">
            <span className="dot" /> AI-Powered Interview Coach
          </div>
          <h1>
            Ace your next
            <br />
            interview <em className="shimmer">with AI.</em>
          </h1>
          <p className="sub">
            Practice with an intelligent AI interviewer, get instant feedback, and land your dream
            job with confidence.
          </p>
          <div className="hero-cta">
            <Magnetic>
              <Link href="/signup" className="btn btn-accent">
                Start For Free →
              </Link>
            </Magnetic>
            <Magnetic>
              <button type="button" className="btn btn-line" onClick={() => setDemoOpen(true)}>
                ▶ &nbsp;Watch Demo
              </button>
            </Magnetic>
          </div>
          <div className="stats-row">
            <div className="stat">
              <b className="num">
                <CountUp to={57} suffix="K+" />
              </b>
              <span>Users</span>
            </div>
            <div className="stat">
              <b className="num">
                <CountUp to={4.8} decimals={1} suffix="★" />
              </b>
              <span>Rating</span>
            </div>
            <div className="stat">
              <b className="num">
                <CountUp to={10} suffix="K+" />
              </b>
              <span>Interviews</span>
            </div>
          </div>
        </div>

        <div className="clippings">
          <FloatingCard mx={mx} my={my} className="clip c1" depth={26} floatDuration={7000} rotate={2}>
            <div className="clip-lbl">
              <span>Mock Interview</span>
              <span>SWE · SR</span>
            </div>
            <div className="clip-q">Explain closures in JavaScript.</div>
            <div className="bar" style={{ marginTop: 14 }}>
              <i style={{ width: '72%' }} />
            </div>
          </FloatingCard>

          <FloatingCard mx={mx} my={my} className="clip c2" depth={42} floatDuration={8500} rotate={-2.5}>
            <div className="clip-lbl">
              <span>Final Score</span>
              <span>Q.05 / 05</span>
            </div>
            <div className="clip-score">
              <b className="num">8.2</b>
              <em>/ 10</em>
            </div>
            <div
              className="mono"
              style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 10, letterSpacing: '.03em' }}
            >
              Top 12% of candidates
            </div>
          </FloatingCard>

          <FloatingCard mx={mx} my={my} className="clip c3" depth={16} floatDuration={9500} rotate={1.5}>
            <div className="clip-lbl">
              <span>Feedback</span>
              <span>Live</span>
            </div>
            <div className="clip-row">
              <span className="tick">
                <svg viewBox="0 0 24 24" className="ico">
                  <path d="m20 6-11 11-5-5" />
                </svg>
              </span>{' '}
              Strong technical clarity
            </div>
            <div className="clip-row">
              <span className="tick">
                <svg viewBox="0 0 24 24" className="ico">
                  <path d="m20 6-11 11-5-5" />
                </svg>
              </span>{' '}
              Confident, structured pace
            </div>
          </FloatingCard>
        </div>
      </div>

      <DemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
}
