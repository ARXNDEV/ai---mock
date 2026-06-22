'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Share2, Check } from 'lucide-react';
import type { AnswerRecord, Role, Difficulty } from '@/lib/types';

function snippet(text: string, max = 80): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function scoreClass(score: number): 'hi' | 'mid' {
  return score >= 7 ? 'hi' : 'mid';
}

export default function SummaryScreen({
  answers,
  onRestart,
  role,
  difficulty,
}: {
  answers: AnswerRecord[];
  onRestart: () => void;
  role?: Role;
  difficulty?: Difficulty;
}) {
  const [shared, setShared] = useState(false);
  const scores = answers.map((a) => a.feedback.score);
  const overall = scores.length
    ? Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10
    : 0;

  const byScoreDesc = [...answers].sort((a, b) => b.feedback.score - a.feedback.score);
  const byScoreAsc = [...answers].sort((a, b) => a.feedback.score - b.feedback.score);
  const strengths = byScoreDesc.slice(0, 3).map((a) => a.feedback.good).filter(Boolean);
  const tips = byScoreAsc.slice(0, 3).map((a) => a.feedback.missing).filter(Boolean);

  async function handleShare() {
    const params = new URLSearchParams({ score: String(overall) });
    if (role) params.set('role', role);
    if (difficulty) params.set('diff', difficulty);
    const url = `${window.location.origin}/share?${params.toString()}`;
    const shareData = {
      title: 'My Intervue.ai score',
      text: `I scored ${overall}/10 on an AI mock interview.`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      /* user dismissed the share sheet — no-op */
    }
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Interview complete
        </div>
        <h1 className="serif" style={{ fontSize: 'clamp(34px,5vw,52px)', lineHeight: 1.02, letterSpacing: '-0.01em' }}>
          Here&apos;s how you did.
        </h1>
      </div>

      <div className="feature" style={{ alignItems: 'center', textAlign: 'center', marginBottom: 22 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>
          Overall score
        </div>
        <div className={`num s-score ${scoreClass(overall)}`} style={{ fontSize: 76, lineHeight: 1, marginTop: 8 }}>
          {overall}
          <span style={{ fontSize: 26, color: 'var(--ink-mute)' }}>/10</span>
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 8 }}>
          {answers.length} question{answers.length === 1 ? '' : 's'} answered
        </div>
      </div>

      <div className="feature" style={{ marginBottom: 22 }}>
        <h3 style={{ color: 'var(--green)', marginBottom: 14 }}>Strengths</h3>
        {strengths.length ? (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'disc', paddingLeft: 18, color: 'var(--ink-soft)', fontSize: 14.5 }}>
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'var(--ink-mute)', fontSize: 14 }}>No clear strengths captured this round.</p>
        )}
      </div>

      <div className="feature" style={{ marginBottom: 22 }}>
        <h3 style={{ color: 'var(--ochre)', marginBottom: 14 }}>Top 3 improvement tips</h3>
        {tips.length ? (
          <ol style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'decimal', paddingLeft: 18, color: 'var(--ink-soft)', fontSize: 14.5 }}>
            {tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        ) : (
          <p style={{ color: 'var(--ink-mute)', fontSize: 14 }}>No major gaps identified — nicely done.</p>
        )}
      </div>

      <div className="feature" style={{ marginBottom: 26 }}>
        <h3 style={{ marginBottom: 14 }}>Per-question breakdown</h3>
        <ul style={{ display: 'flex', flexDirection: 'column' }}>
          {answers.map((a, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '12px 0',
                borderBottom: i === answers.length - 1 ? 'none' : '1px solid var(--line)',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
                <span className="mono" style={{ color: 'var(--ink-mute)', marginRight: 6 }}>
                  Q{i + 1}
                </span>
                {snippet(a.question)}
              </span>
              <span className={`num s-score ${scoreClass(a.feedback.score)}`} style={{ fontSize: 24 }}>
                {a.feedback.score}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="btn btn-line"
        style={{ width: '100%', marginBottom: 12 }}
        onClick={handleShare}
      >
        {shared ? <Check width={18} height={18} /> : <Share2 width={18} height={18} />}
        {shared ? 'Link copied!' : 'Share my score'}
      </button>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-accent" style={{ flex: 1 }} onClick={onRestart}>
          Start New Interview
        </button>
        <Link href="/dashboard" className="btn btn-line" style={{ flex: 1 }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
