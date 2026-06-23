'use client';

import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import type { InterviewConfig } from '@/lib/types';
import { ROLE_LABELS, DIFFICULTY_LABELS, FOCUSES } from '@/lib/constants';
import { speak, cancelSpeech } from '@/lib/speech';

const MUTE_KEY = 'intervue:tts-muted';

export function IntroScreen({
  config,
  userName,
  onBegin,
}: {
  config: InterviewConfig;
  userName: string;
  onBegin: () => void;
}) {
  const spokenRef = useRef(false);
  const name = userName?.trim() || 'there';
  const focusLabel = FOCUSES.find((f) => f.value === config.focus)?.label ?? 'Mixed';

  // Aria greets the candidate aloud on arrival (respecting the mute preference).
  useEffect(() => {
    if (spokenRef.current) return;
    spokenRef.current = true;
    let muted = false;
    try {
      muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      /* ignore */
    }
    if (!muted) {
      speak(
        `Hi ${name}. I'm Aria, your interviewer today. We'll go through ${config.questionCount} questions for a ${DIFFICULTY_LABELS[config.difficulty]} ${ROLE_LABELS[config.role]} role. Take your time, think out loud, and I'll give you feedback after every answer. Ready when you are.`,
      );
    }
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="auth-card" style={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>
      <div
        style={{
          margin: '0 auto 18px',
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--ink)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Sparkles width={26} height={26} style={{ color: '#f0573b' }} />
      </div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>
        Your AI interviewer
      </div>
      <h1 className="serif" style={{ fontSize: 32, lineHeight: 1.1, textTransform: 'capitalize' }}>
        Hi {name} 👋 I&apos;m Aria.
      </h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.65, marginTop: 12, maxWidth: 450, marginInline: 'auto' }}>
        We&apos;ll do a <strong>{config.questionCount}-question</strong> {ROLE_LABELS[config.role]} interview at{' '}
        <strong>{DIFFICULTY_LABELS[config.difficulty]}</strong> level
        {config.focus !== 'mixed' ? (
          <>
            {' '}
            with a <strong>{focusLabel}</strong> focus
          </>
        ) : null}
        . Answer by voice — or switch to <strong>Code</strong> anytime. I&apos;ll give instant feedback after each answer,
        and a full breakdown at the end.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, margin: '22px 0 4px', flexWrap: 'wrap' }}>
        {['🎙️ Answer aloud', '💬 Live follow-ups', '📊 Instant scoring'].map((s) => (
          <span key={s} className="mono" style={{ fontSize: 11, letterSpacing: '0.04em', color: 'var(--ink-mute)' }}>
            {s}
          </span>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-accent"
        style={{ width: '100%', marginTop: 18 }}
        onClick={() => {
          cancelSpeech();
          onBegin();
        }}
      >
        I&apos;m ready — let&apos;s begin →
      </button>
      <p style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 12 }}>
        We&apos;ll start with a quick warm-up about you.
      </p>
    </div>
  );
}
