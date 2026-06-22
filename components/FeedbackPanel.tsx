'use client';

import { useState } from 'react';
import type { Feedback } from '@/lib/types';

function scoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-600';
  if (score >= 5) return 'text-amber-600';
  return 'text-red-600';
}

export default function FeedbackPanel({
  feedback,
  onNext,
  isLastQuestion,
}: {
  feedback: Feedback;
  onNext: () => void;
  isLastQuestion: boolean;
}) {
  const [showSuggestion, setShowSuggestion] = useState(false);

  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Feedback</h3>
        <div className={`text-2xl font-bold ${scoreColor(feedback.score)}`}>
          {feedback.score}
          <span className="text-base font-normal text-slate-400">/10</span>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-emerald-700">✓ What was good</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{feedback.good || '—'}</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-red-700">✕ What was missing</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{feedback.missing || '—'}</p>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowSuggestion((s) => !s)}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          {showSuggestion ? '▾ Hide suggested answer' : '▸ Show suggested answer'}
        </button>
        {showSuggestion && (
          <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
            {feedback.suggestion || '—'}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        {isLastQuestion ? 'See Summary' : 'Next Question'}
      </button>
    </div>
  );
}
