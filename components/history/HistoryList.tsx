'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SessionRow, SessionQuestion } from '@/lib/database.types';
import type { Role, Difficulty } from '@/lib/types';
import { ROLE_LABELS, DIFFICULTY_LABELS } from '@/lib/constants';

export function HistoryList({ sessions }: { sessions: SessionRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!sessions.length) {
    return (
      <div className="sessions">
        <div className="mono" style={{ padding: '28px 26px', textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>
          No interviews yet — your completed sessions will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="sessions">
      <div className="sess-thead">
        <span>Role</span>
        <span>Track</span>
        <span>Score</span>
        <span>When</span>
        <span />
      </div>
      {sessions.map((s) => {
        const questions = Array.isArray(s.questions) ? (s.questions as unknown as SessionQuestion[]) : [];
        const open = openId === s.id;
        return (
          <div key={s.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : s.id)}
              className="session-row"
              style={{ width: '100%', textAlign: 'left', background: 'none', cursor: 'pointer' }}
            >
              <div className="s-role">{ROLE_LABELS[s.role as Role] ?? s.role}</div>
              <div className="s-sub">{DIFFICULTY_LABELS[s.difficulty as Difficulty] ?? s.difficulty}</div>
              <div className={`s-score num ${s.overall_score >= 7 ? 'hi' : 'mid'}`}>{s.overall_score}</div>
              <div className="s-time">
                {new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <ChevronDown
                width={16}
                height={16}
                style={{ justifySelf: 'end', color: 'var(--ink-mute)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }}
              />
            </button>
            {open && (
              <div style={{ padding: '6px 26px 22px', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: '1px solid var(--line)' }}>
                {questions.length ? (
                  questions.map((q, i) => (
                    <div key={i} style={{ background: 'var(--card-2)', border: '1px solid var(--line)', borderRadius: 13, padding: '16px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                        <p style={{ fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.2 }}>
                          Q{i + 1}. {q.question}
                        </p>
                        <span
                          className="num"
                          style={{ fontFamily: 'var(--serif)', fontSize: 22, color: q.score >= 7 ? 'var(--green)' : 'var(--ochre)' }}
                        >
                          {q.score}
                        </span>
                      </div>
                      <p className="eyebrow" style={{ color: 'var(--green)', marginTop: 12, marginBottom: 4 }}>
                        What went well
                      </p>
                      <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{q.good || '—'}</p>
                      <p className="eyebrow" style={{ color: 'var(--ochre)', marginTop: 10, marginBottom: 4 }}>
                        Missing
                      </p>
                      <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{q.missing || '—'}</p>
                      <details style={{ marginTop: 8 }}>
                        <summary className="mono" style={{ cursor: 'pointer', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Suggested answer
                        </summary>
                        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 6, fontFamily: 'var(--serif)', lineHeight: 1.6 }}>
                          {q.suggestion || '—'}
                        </p>
                      </details>
                    </div>
                  ))
                ) : (
                  <p className="mono" style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
                    No per-question detail saved for this session.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
