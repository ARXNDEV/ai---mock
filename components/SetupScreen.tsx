'use client';

import { useState, type CSSProperties } from 'react';
import type { InterviewConfig, Role, Difficulty, InterviewFocus } from '@/lib/types';
import { ROLES, DIFFICULTIES, QUESTION_COUNTS, FOCUSES, MAX_QUESTIONS } from '@/lib/constants';

function optStyle(active: boolean): CSSProperties {
  return {
    fontFamily: 'var(--sans)',
    fontSize: 13,
    fontWeight: 600,
    padding: '11px 12px',
    borderRadius: 9,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--line-strong)'}`,
    background: active ? 'rgba(229,64,43,0.08)' : 'var(--card)',
    color: active ? 'var(--accent-deep)' : 'var(--ink-soft)',
    cursor: 'pointer',
    transition: 'var(--t)',
  };
}

export default function SetupScreen({
  onStart,
  loading,
  error,
  remaining,
  isPro,
  initialRole = 'swe',
  initialDifficulty = 'mid',
}: {
  onStart: (config: InterviewConfig) => void;
  loading: boolean;
  error: string | null;
  remaining: number | null;
  isPro: boolean;
  initialRole?: Role;
  initialDifficulty?: Difficulty;
}) {
  const [role, setRole] = useState<Role>(initialRole);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [questionCount, setQuestionCount] = useState<number>(MAX_QUESTIONS);
  const [focus, setFocus] = useState<InterviewFocus>('mixed');
  const [jd, setJd] = useState('');
  const [resume, setResume] = useState('');

  return (
    <div className="auth-card" style={{ width: '100%', maxWidth: 560 }}>
      <div style={{ marginBottom: 22 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          New interview
        </div>
        <h1 className="serif" style={{ fontSize: 34, lineHeight: 1.05, letterSpacing: '-0.01em' }}>
          Set up your mock interview
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 8 }}>
          {isPro
            ? 'Unlimited interviews on Pro.'
            : remaining != null
              ? `${remaining} free interview${remaining === 1 ? '' : 's'} left this month.`
              : ''}
        </p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ color: 'var(--ink-mute)', marginBottom: 10 }}>
          Role
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
          {ROLES.map((r) => (
            <button key={r.value} type="button" onClick={() => setRole(r.value)} style={optStyle(role === r.value)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ color: 'var(--ink-mute)', marginBottom: 10 }}>
          Difficulty
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDifficulty(d.value)}
              style={optStyle(difficulty === d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 14, marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--ink-mute)', marginBottom: 10 }}>
            Questions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {QUESTION_COUNTS.map((n) => (
              <button key={n} type="button" onClick={() => setQuestionCount(n)} style={optStyle(questionCount === n)}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ color: 'var(--ink-mute)', marginBottom: 10 }}>
            Focus
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {FOCUSES.map((f) => (
              <button key={f.value} type="button" onClick={() => setFocus(f.value)} style={optStyle(focus === f.value)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ color: 'var(--ink-mute)', marginBottom: 10 }}>
          Job description (optional)
        </div>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={4}
          placeholder="Paste the job description to tailor the questions…"
          style={{
            width: '100%',
            resize: 'vertical',
            border: '1px solid var(--line-strong)',
            background: 'var(--card)',
            borderRadius: 9,
            padding: 12,
            fontFamily: 'var(--sans)',
            fontSize: 14,
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ color: 'var(--ink-mute)', marginBottom: 10 }}>
          Your résumé (optional) — for personalized questions
        </div>
        <textarea
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          rows={3}
          placeholder="Paste your résumé so questions reference your real projects & stack…"
          style={{
            width: '100%',
            resize: 'vertical',
            border: '1px solid var(--line-strong)',
            background: 'var(--card)',
            borderRadius: 9,
            padding: 12,
            fontFamily: 'var(--sans)',
            fontSize: 14,
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
      </div>

      {error && (
        <p className="mono" style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 14 }}>
          {error}
        </p>
      )}

      <button
        type="button"
        className="btn btn-accent"
        style={{ width: '100%' }}
        disabled={loading}
        onClick={() => onStart({ role, difficulty, jd, questionCount, focus, resume })}
      >
        {loading ? 'Preparing your interview…' : 'Start Interview →'}
      </button>
    </div>
  );
}
