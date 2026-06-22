'use client';

import type { AnswerRecord } from '@/lib/types';

function snippet(text: string, max = 80): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function overallColor(score: number): string {
  if (score >= 8) return 'text-emerald-600';
  if (score >= 5) return 'text-amber-600';
  return 'text-red-600';
}

export default function SummaryScreen({
  answers,
  onRestart,
}: {
  answers: AnswerRecord[];
  onRestart: () => void;
}) {
  const scores = answers.map((a) => a.feedback.score);
  const overall = scores.length
    ? Math.round((scores.reduce((sum, n) => sum + n, 0) / scores.length) * 10) / 10
    : 0;

  const byScoreDesc = [...answers].sort((a, b) => b.feedback.score - a.feedback.score);
  const byScoreAsc = [...answers].sort((a, b) => a.feedback.score - b.feedback.score);

  // Strengths: what went well on the strongest answers.
  const strengths = byScoreDesc.slice(0, 3).map((a) => a.feedback.good).filter(Boolean);
  // Top improvement tips: the gaps from the weakest answers.
  const tips = byScoreAsc.slice(0, 3).map((a) => a.feedback.missing).filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Interview Complete</h1>
        <p className="mt-2 text-slate-600">Here&apos;s how you did across {answers.length} questions.</p>
      </header>

      <div className="flex flex-col items-center rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Overall score</p>
        <p className={`mt-2 text-6xl font-bold ${overallColor(overall)}`}>
          {overall}
          <span className="text-2xl font-normal text-slate-400">/10</span>
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-lg font-semibold text-emerald-700">Strengths</h2>
        {strengths.length ? (
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No clear strengths captured this round.</p>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-lg font-semibold text-red-700">Top 3 improvement tips</h2>
        {tips.length ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-500">No major gaps identified — nicely done.</p>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Per-question breakdown</h2>
        <ul className="space-y-3">
          {answers.map((a, i) => (
            <li key={i} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <span className="text-sm text-slate-700">
                <span className="font-medium text-slate-400">Q{i + 1}.</span> {snippet(a.question)}
              </span>
              <span className={`shrink-0 text-sm font-bold ${overallColor(a.feedback.score)}`}>
                {a.feedback.score}/10
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        Start New Interview
      </button>
    </div>
  );
}
