'use client';

import { useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { AnswerRecord, InterviewConfig, Role, Difficulty } from '@/lib/types';
import type { SessionQuestion } from '@/lib/database.types';
import { MAX_QUESTIONS } from '@/lib/constants';
import { fetchNextQuestion, consumeInterviewCredit, saveSession } from '@/lib/api';
import { Logo } from '@/components/brand/logo';
import SetupScreen from '@/components/SetupScreen';
import InterviewScreen from '@/components/InterviewScreen';
import SummaryScreen from '@/components/SummaryScreen';
import { UpgradeGate } from '@/components/interview/UpgradeGate';

type Phase = 'setup' | 'interview' | 'summary';

function TopBar() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 24px',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <Logo href="/dashboard" />
      <Link href="/dashboard" className="btn btn-ghost btn-sm">
        ← Dashboard
      </Link>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '32px 24px' }}>
        {children}
      </div>
    </div>
  );
}

export default function InterviewApp({
  isPro,
  remaining,
  initialRole,
  initialDifficulty,
}: {
  isPro: boolean;
  remaining: number | null;
  initialRole: Role;
  initialDifficulty: Difficulty;
}) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [credits, setCredits] = useState<number | null>(remaining);
  const [limitReached, setLimitReached] = useState(false);

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  // Holds the next (adaptive) question, prefetched while the user reads feedback.
  const nextQuestionPromiseRef = useRef<Promise<string | null> | null>(null);

  async function loadNextQuestion(cfg: InterviewConfig, previousQuestions: string[], lastAnswer?: string) {
    setAdvancing(true);
    setAdvanceError(null);
    try {
      const q = await fetchNextQuestion({
        role: cfg.role,
        difficulty: cfg.difficulty,
        jd: cfg.jd,
        previousQuestions,
        lastAnswer,
      });
      setAskedQuestions((prev) => [...prev, q]);
      setCurrentQuestion(q);
    } catch (e) {
      setAdvanceError(e instanceof Error ? e.message : 'Failed to load the next question.');
    } finally {
      setAdvancing(false);
    }
  }

  // Kick off the next question as soon as an answer is scored, so advancing is
  // instant. Best-effort: resolves to null on failure and handleNext re-fetches.
  function handleAnswerEvaluated(transcript: string) {
    if (!config || answers.length + 1 >= MAX_QUESTIONS) return;
    nextQuestionPromiseRef.current = fetchNextQuestion({
      role: config.role,
      difficulty: config.difficulty,
      jd: config.jd,
      previousQuestions: askedQuestions,
      lastAnswer: transcript,
    })
      .then((q) => q)
      .catch(() => null);
  }

  async function handleStart(cfg: InterviewConfig) {
    setStarting(true);
    setStartError(null);
    try {
      const credit = await consumeInterviewCredit();
      if (!credit.ok) {
        setLimitReached(true);
        return;
      }
      if (!isPro) setCredits(credit.remaining);
      const q = await fetchNextQuestion({
        role: cfg.role,
        difficulty: cfg.difficulty,
        jd: cfg.jd,
        previousQuestions: [],
      });
      setConfig(cfg);
      setAskedQuestions([q]);
      setCurrentQuestion(q);
      setAnswers([]);
      setPhase('interview');
    } catch (e) {
      setStartError(e instanceof Error ? e.message : 'Failed to start the interview.');
    } finally {
      setStarting(false);
    }
  }

  async function persistSession(all: AnswerRecord[], cfg: InterviewConfig) {
    const overall = all.length
      ? Math.round((all.reduce((acc, r) => acc + r.feedback.score, 0) / all.length) * 10) / 10
      : 0;
    const questions: SessionQuestion[] = all.map((r) => ({
      question: r.question,
      transcript: r.transcript,
      score: r.feedback.score,
      good: r.feedback.good,
      missing: r.feedback.missing,
      suggestion: r.feedback.suggestion,
    }));
    try {
      await saveSession({ role: cfg.role, difficulty: cfg.difficulty, overall_score: overall, questions });
    } catch {
      // non-blocking
    }
  }

  async function handleNext(record: AnswerRecord) {
    const updated = [...answers, record];
    setAnswers(updated);
    if (updated.length >= MAX_QUESTIONS || !config) {
      if (config) await persistSession(updated, config);
      setPhase('summary');
      return;
    }

    // Use the question prefetched during feedback if it's ready; else fetch now.
    const prefetch = nextQuestionPromiseRef.current;
    nextQuestionPromiseRef.current = null;
    if (!prefetch) {
      await loadNextQuestion(config, askedQuestions, record.transcript);
      return;
    }
    setAdvancing(true);
    setAdvanceError(null);
    try {
      const q = await prefetch;
      if (q) {
        setAskedQuestions((prev) => [...prev, q]);
        setCurrentQuestion(q);
      } else {
        await loadNextQuestion(config, askedQuestions, record.transcript);
      }
    } catch {
      await loadNextQuestion(config, askedQuestions, record.transcript);
    } finally {
      setAdvancing(false);
    }
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

  if (limitReached) {
    return (
      <Shell>
        <UpgradeGate />
      </Shell>
    );
  }

  if (phase === 'setup') {
    return (
      <Shell>
        <SetupScreen
          onStart={handleStart}
          loading={starting}
          error={startError}
          remaining={credits}
          isPro={isPro}
          initialRole={initialRole}
          initialDifficulty={initialDifficulty}
        />
      </Shell>
    );
  }

  if (phase === 'summary') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        <div style={{ flex: 1, padding: '32px 24px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <SummaryScreen
              answers={answers}
              onRestart={handleRestart}
              role={config?.role}
              difficulty={config?.difficulty}
            />
          </div>
        </div>
      </div>
    );
  }

  // interview phase
  if (advancing) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <p className="mono" style={{ color: 'var(--ink-mute)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 12 }}>
          Preparing next question…
        </p>
      </div>
    );
  }
  if (advanceError) {
    return (
      <Shell>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <p className="mono" style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 16 }}>
            {advanceError}
          </p>
          {config && (
            <button type="button" className="btn btn-accent" onClick={() => loadNextQuestion(config, askedQuestions)}>
              Retry
            </button>
          )}
        </div>
      </Shell>
    );
  }

  return (
    <InterviewScreen
      key={answers.length}
      config={config as InterviewConfig}
      question={currentQuestion}
      questionNumber={answers.length + 1}
      totalQuestions={MAX_QUESTIONS}
      isLastQuestion={answers.length + 1 >= MAX_QUESTIONS}
      onNext={handleNext}
      onAnswerEvaluated={handleAnswerEvaluated}
    />
  );
}
