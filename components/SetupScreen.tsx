'use client';

import { useState } from 'react';
import type { InterviewConfig, Role, Difficulty } from '@/lib/types';
import { ROLES, DIFFICULTIES } from '@/lib/constants';

export default function SetupScreen({
  onStart,
  loading,
  error,
}: {
  onStart: (config: InterviewConfig) => void;
  loading: boolean;
  error: string | null;
}) {
  const [role, setRole] = useState<Role>('swe');
  const [difficulty, setDifficulty] = useState<Difficulty>('mid');
  const [jd, setJd] = useState('');

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">AI Mock Interview</h1>
        <p className="mt-2 text-slate-600">
          Practice with a strict but fair AI interviewer. Speak your answers and get instant,
          honest feedback.
        </p>
      </header>

      <div className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-700">Role</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  role === r.value
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-700">Difficulty</legend>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDifficulty(d.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  difficulty === d.value
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="jd" className="mb-2 block text-sm font-semibold text-slate-700">
            Job description <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="jd"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={5}
            placeholder="Paste the job description to tailor the questions…"
            className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={() => onStart({ role, difficulty, jd })}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Preparing your interview…' : 'Start Interview'}
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Microphone access is required. Use a Chromium-based browser on http://localhost for best
        results.
      </p>
    </div>
  );
}
