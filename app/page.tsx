'use client';

import { useState } from 'react';
import type { AnswerRecord, InterviewConfig } from '@/lib/types';
import { MAX_QUESTIONS } from '@/lib/constants';
import { fetchNextQuestion } from '@/lib/api';
import SetupScreen from '@/components/SetupScreen';
import InterviewScreen from '@/components/InterviewScreen';
import SummaryScreen from '@/components/SummaryScreen';

type Phase = 'setup' | 'interview' | 'summary';

export default function Home() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  // `setup` flow state.
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // `interview` → next-question flow state.
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  async function loadNextQuestion(cfg: InterviewConfig, previousQuestions: string[]) {
    setAdvancing(true);
    setAdvanceError(null);
    try {
      const question = await fetchNextQuestion({
        role: cfg.role,
        difficulty: cfg.difficulty,
        jd: cfg.jd,
        previousQuestions,
      });
      setAskedQuestions((prev) => [...prev, question]);
      setCurrentQuestion(question);
    } catch (e) {
      setAdvanceError(e instanceof Error ? e.message : 'Failed to load the next question.');
    } finally {
      setAdvancing(false);
    }
  }

  async function handleStart(cfg: InterviewConfig) {
    setStarting(true);
    setStartError(null);
    try {
      const question = await fetchNextQuestion({
        role: cfg.role,
        difficulty: cfg.difficulty,
        jd: cfg.jd,
        previousQuestions: [],
      });
      setConfig(cfg);
      setAskedQuestions([question]);
      setCurrentQuestion(question);
      setAnswers([]);
      setPhase('interview');
    } catch (e) {
      setStartError(e instanceof Error ? e.message : 'Failed to start the interview.');
    } finally {
      setStarting(false);
    }
  }

  async function handleNext(record: AnswerRecord) {
    const updated = [...answers, record];
    setAnswers(updated);

    if (updated.length >= MAX_QUESTIONS || !config) {
      setPhase('summary');
      return;
    }
    await loadNextQuestion(config, askedQuestions);
  }

  function handleRestart() {
    setPhase('setup');
    setConfig(null);
    setAskedQuestions([]);
    setCurrentQuestion('');
    setAnswers([]);
    setStartError(null);
    setAdvanceError(null);
  }

  return (
    <main className="px-4 py-10 sm:py-16">
      {phase === 'setup' && (
        <SetupScreen onStart={handleStart} loading={starting} error={startError} />
      )}

      {phase === 'interview' && config && (
        <>
          {advancing && (
            <div className="mx-auto max-w-2xl text-center text-sm text-slate-500">
              Loading next question…
            </div>
          )}

          {!advancing && advanceError && (
            <div className="mx-auto max-w-2xl space-y-3 text-center">
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{advanceError}</p>
              <button
                type="button"
                onClick={() => loadNextQuestion(config, askedQuestions)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          )}

          {!advancing && !advanceError && (
            <InterviewScreen
              key={answers.length}
              config={config}
              question={currentQuestion}
              questionNumber={answers.length + 1}
              totalQuestions={MAX_QUESTIONS}
              isLastQuestion={answers.length + 1 >= MAX_QUESTIONS}
              onNext={handleNext}
            />
          )}
        </>
      )}

      {phase === 'summary' && <SummaryScreen answers={answers} onRestart={handleRestart} />}
    </main>
  );
}
