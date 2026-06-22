'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DemoModal } from './DemoModal';

export function Hero() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <section className="hero" id="top">
      <div className="hero-grid">
        <div>
          <div className="hero-badge">
            <span className="dot" /> AI-Powered Interview Coach
          </div>
          <h1>
            Ace your next
            <br />
            interview <em>with AI.</em>
          </h1>
          <p className="sub">
            Practice with an intelligent AI interviewer, get instant feedback, and land your dream
            job with confidence.
          </p>
          <div className="hero-cta">
            <Link href="/signup" className="btn btn-accent">
              Start For Free →
            </Link>
            <button type="button" className="btn btn-line" onClick={() => setDemoOpen(true)}>
              ▶ &nbsp;Watch Demo
            </button>
          </div>
          <div className="stats-row">
            <div className="stat">
              <b className="num">57K+</b>
              <span>Users</span>
            </div>
            <div className="stat">
              <b className="num">4.8★</b>
              <span>Rating</span>
            </div>
            <div className="stat">
              <b className="num">10K+</b>
              <span>Interviews</span>
            </div>
          </div>
        </div>

        <div className="clippings">
          <div className="clip c1">
            <div className="clip-lbl">
              <span>Mock Interview</span>
              <span>SWE · SR</span>
            </div>
            <div className="clip-q">Explain closures in JavaScript.</div>
            <div className="bar" style={{ marginTop: 14 }}>
              <i style={{ width: '72%' }} />
            </div>
          </div>
          <div className="clip c2">
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
          </div>
          <div className="clip c3">
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
          </div>
        </div>
      </div>

      <DemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
}
