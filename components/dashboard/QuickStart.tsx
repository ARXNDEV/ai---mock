'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROLES, DIFFICULTIES } from '@/lib/constants';

export function QuickStart() {
  const router = useRouter();
  const [role, setRole] = useState('swe');
  const [difficulty, setDifficulty] = useState('senior');

  return (
    <div className="quickstart">
      <span className="qs-eye serif">✦</span>
      <div className="qs-left">
        <h3>Ready for your next interview?</h3>
        <p>Pick a role and difficulty — your AI interviewer will be ready in seconds.</p>
      </div>
      <div className="qs-controls">
        <div className="select">
          <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="select">
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Difficulty">
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-accent"
          onClick={() => router.push(`/interview?role=${role}&difficulty=${difficulty}`)}
        >
          Start Interview →
        </button>
      </div>
    </div>
  );
}
