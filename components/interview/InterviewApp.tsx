'use client';

import { useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AnswerRecord, InterviewConfig, Role, Difficulty } from '@/lib/types';
import type { SessionQuestion } from '@/lib/database.types';
import { MAX_QUESTIONS } from '@/lib/constants';
import { fetchNextQuestion, consumeInterviewCredit, saveSession } from '@/lib/api';
import { Logo } from '@/components/brand/logo';
import SetupScreen from '@/components/SetupScreen';
import InterviewScreen from '@/components/InterviewScreen';
import SummaryScreen from '@/components/SummaryScreen';
import { UpgradeGate } from '@/components/interview/UpgradeGate';
import { IntroScreen } from '@/components/interview/IntroScreen';
import { ClosingScreen } from '@/components/interview/ClosingScreen';

type Phase = 'setup' | 'intro' | 'interview' | 'closing' | 'summary';

// The interview always opens with a fixed, human warm-up (counts as Q1). The
// AI's first generated question then adapts to the candidate's background.
const WARMUP_QUESTION =
  "To start, tell me a bit about yourself — your background, and what you're looking for in your next role.";

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
  userName,
}: {
  isPro: boolean;
  remaining: number | null;
  initialRole: Role;
  initialDifficulty: Difficulty;
  userName: string;
}) {
  const router = useRouter();
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
        focus: cfg.focus,
        resume: cfg.resume,
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
    if (!config || answers.length + 1 >= config.questionCount) return;
    nextQuestionPromiseRef.current = fetchNextQuestion({
      role: config.role,
      difficulty: config.difficulty,
      jd: config.jd,
      previousQuestions: askedQuestions,
      lastAnswer: transcript,
      focus: config.focus,
      resume: config.resume,
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
      // Open with the fixed warm-up (no AI call needed → instant start). The
      // first AI question is fetched after the warm-up answer, so it adapts.
      setConfig(cfg);
      setAskedQuestions([WARMUP_QUESTION]);
      setCurrentQuestion(WARMUP_QUESTION);
      setAnswers([]);
      setPhase('intro');
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
      ...(r.feedback.rubric ? { rubric: r.feedback.rubric } : {}),
    }));
    try {
      await saveSession({ role: cfg.role, difficulty: cfg.difficulty, overall_score: overall, questions });
    } catch (e) {
      // non-blocking, but surface it so failures aren't silent
      console.error('[InterviewApp] failed to save session', e);
    }
  }

  // "End Interview" — save what's been answered so far (incl. the current,
  // already-scored answer if present) and jump to the summary; otherwise just
  // leave. This means stopping early still counts and shows the share option.
  async function handleEndEarly(currentRecord: AnswerRecord | null) {
    const all = currentRecord ? [...answers, currentRecord] : answers;
    if (config && all.length > 0) {
      setAnswers(all);
      await persistSession(all, config);
      setPhase('summary');
    } else {
      router.push('/dashboard');
    }
  }

  async function handleNext(record: AnswerRecord) {
    const updated = [...answers, record];
    setAnswers(updated);
    if (!config || updated.length >= config.questionCount) {
      if (config) {
        void persistSession(updated, config); // save in the background while the closing plays
        setPhase('closing');
      } else {
        setPhase('summary');
      }
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

  if (phase === 'intro' && config) {
    return (
      <Shell>
        <IntroScreen config={config} userName={userName} onBegin={() => setPhase('interview')} />
      </Shell>
    );
  }

  if (phase === 'closing') {
    return (
      <Shell>
        <ClosingScreen userName={userName} onDone={() => setPhase('summary')} />
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
      <Shell>
        <div style={{ textAlign: 'center' }}>
          <div className="ai-avatar live" style={{ margin: '0 auto 18px' }}>
            <svg className="ico" viewBox="0 0 24 24">
              <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
            </svg>
          </div>
          <p className="mono" style={{ color: 'var(--ink-mute)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 12 }}>
            Aria is preparing your next question…
          </p>
        </div>
      </Shell>
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
      totalQuestions={config?.questionCount ?? MAX_QUESTIONS}
      isLastQuestion={answers.length + 1 >= (config?.questionCount ?? MAX_QUESTIONS)}
      onNext={handleNext}
      onAnswerEvaluated={handleAnswerEvaluated}
      onEnd={handleEndEarly}
    />
  );
}
