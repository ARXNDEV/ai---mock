'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { AnswerRecord, Feedback, InterviewConfig } from '@/lib/types';
import { ROLE_LABELS, DIFFICULTY_LABELS } from '@/lib/constants';
import { useRecorder } from '@/hooks/useRecorder';
import { transcribeAudio, evaluateAnswer } from '@/lib/api';
import { ScoreRing } from './interview/ScoreRing';

type Phase = 'idle' | 'transcribing' | 'review' | 'evaluating' | 'feedback';

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(u);
}

function fmt(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function Suggest({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={open ? 'suggest open' : 'suggest'}>
      <div className="suggest-head" onClick={() => setOpen((o) => !o)}>
        <span className="sh-l">✦ Suggested answer</span>
        <svg className="suggest-chev ico" viewBox="0 0 24 24">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      <div className="suggest-body" style={{ maxHeight: open ? 1000 : 0 }}>
        <div className="inner">{text || '—'}</div>
      </div>
    </div>
  );
}

export default function InterviewScreen({
  config,
  question,
  questionNumber,
  totalQuestions,
  isLastQuestion,
  onNext,
}: {
  config: InterviewConfig;
  question: string;
  questionNumber: number;
  totalQuestions: number;
  isLastQuestion: boolean;
  onNext: (record: AnswerRecord) => void;
}) {
  const recorder = useRecorder();
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spokenRef = useRef(false);

  useEffect(() => {
    if (spokenRef.current) return;
    spokenRef.current = true;
    speak(question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (recorder.isRecording) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recorder.isRecording]);

  useEffect(() => {
    if (recorder.audioBlob && phase === 'idle') void handleTranscribe(recorder.audioBlob);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.audioBlob]);

  async function handleTranscribe(blob: Blob) {
    setPhase('transcribing');
    setError(null);
    try {
      const text = await transcribeAudio(blob);
      setTranscript(text);
      setPhase('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transcription failed.');
      recorder.reset();
      setPhase('idle');
    }
  }

  async function handleEvaluate() {
    if (!transcript.trim()) {
      setError('Please record or type an answer first.');
      return;
    }
    setPhase('evaluating');
    setError(null);
    try {
      const fb = await evaluateAnswer({ role: config.role, jd: config.jd, question, transcript });
      setFeedback(fb);
      setPhase('feedback');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Evaluation failed.');
      setPhase('review');
    }
  }

  const recording = recorder.isRecording;
  const pct = Math.round((questionNumber / totalQuestions) * 100);
  const showTranscriptField = phase === 'review' || phase === 'evaluating' || phase === 'feedback';
  const statusText = recording
    ? 'Listening to your answer'
    : phase === 'transcribing'
      ? 'Transcribing…'
      : phase === 'evaluating'
        ? 'Scoring your answer'
        : phase === 'feedback'
          ? 'Feedback ready'
          : phase === 'review'
            ? 'Review your answer'
            : 'Ready when you are';

  return (
    <div className="interview">
      <div className="iv-body">
        <div className="iv-left">
          <div className="iv-top">
            <div className="progress-wrap">
              <div className="progress-label">
                <span>
                  <b>Question {String(questionNumber).padStart(2, '0')}</b> /{' '}
                  {String(totalQuestions).padStart(2, '0')}
                </span>
                <span>{pct}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="role-badge">
              {ROLE_LABELS[config.role]} · {DIFFICULTY_LABELS[config.difficulty]}
            </div>
          </div>

          <div className="ai-avatar-row">
            <div className={recording ? 'ai-avatar live' : 'ai-avatar'}>
              <svg className="ico" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
              </svg>
            </div>
            <div>
              <div className="ai-name">Aria · AI Interviewer</div>
              <div className="ai-status">
                <span className="blip" /> {statusText}
              </div>
            </div>
          </div>

          <div className="q-card">
            <div className="q-tag">Current Question</div>
            <div className="q-text">{question}</div>
            <div className="q-hint">
              <span className="qh-mark">✦</span> Take a moment to structure your answer — explain the{' '}
              <em>what</em>, then the <em>why</em>.
            </div>
          </div>

          <div className="transcript">
            <div className="t-head">
              <span>Live Transcript</span>
              {recording && (
                <span className="live">
                  <span className="blip" /> Recording
                </span>
              )}
            </div>
            {showTranscriptField ? (
              <textarea
                className="t-text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                readOnly={phase !== 'review'}
                rows={5}
                placeholder="Your answer…"
              />
            ) : (
              <div className="t-text">
                <span className="placeholder">
                  {recording
                    ? 'Listening… speak your answer now.'
                    : phase === 'transcribing'
                      ? 'Transcribing your answer…'
                      : 'Your spoken answer will appear here. Tap the record button below to begin.'}
                </span>
              </div>
            )}
          </div>

          {error && (
            <p className="mono" style={{ color: 'var(--accent)', fontSize: 13 }}>
              {error}
            </p>
          )}
        </div>

        <div className="iv-right">
          <div className="fb-title">
            Live feedback
            {feedback && (
              <span className="lv">
                <span className="blip" /> LIVE
              </span>
            )}
          </div>

          <ScoreRing score={feedback ? feedback.score : null} />

          {feedback ? (
            <>
              <div className="fb-block good">
                <div className="fb-h">
                  <span className="dot" /> What you did well
                </div>
                <ul>
                  <li>{feedback.good || '—'}</li>
                </ul>
              </div>
              <div className="fb-block miss">
                <div className="fb-h">
                  <span className="dot" /> Missing points
                </div>
                <ul>
                  <li>{feedback.missing || '—'}</li>
                </ul>
              </div>
              <Suggest text={feedback.suggestion} />
            </>
          ) : (
            <div
              style={{
                color: 'rgba(240,236,227,0.55)',
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: 'var(--serif)',
              }}
            >
              {phase === 'evaluating'
                ? 'Scoring your answer…'
                : 'Record and submit your answer to get an instant score, strengths, and improvements.'}
            </div>
          )}

          {(phase === 'review' || phase === 'evaluating') && (
            <button className="btn btn-paper" onClick={handleEvaluate} disabled={phase === 'evaluating'}>
              {phase === 'evaluating' ? 'Scoring…' : 'Submit for Feedback'}
            </button>
          )}
          {phase === 'feedback' && feedback && (
            <button
              className="btn btn-paper"
              onClick={() => onNext({ question, transcript, feedback })}
            >
              {isLastQuestion ? 'See Summary →' : 'Next Question →'}
            </button>
          )}
        </div>
      </div>

      <div className="iv-bottom">
        <div className="rec-zone">
          <button
            className={recording ? 'rec-btn active' : 'rec-btn'}
            aria-label="Record"
            onClick={() => (recording ? recorder.stop() : recorder.start())}
            disabled={phase === 'transcribing' || phase === 'evaluating'}
          >
            <svg className="rec-mic ico" viewBox="0 0 24 24">
              <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill="#fff" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" fill="none" />
            </svg>
            <span className="rec-square" />
          </button>
          <div>
            <div className="rec-label">{recording ? 'Stop Recording' : 'Start Recording'}</div>
            <div className="rec-sub">
              {recording
                ? 'Recording…'
                : phase === 'review' || phase === 'feedback'
                  ? 'Re-record if needed'
                  : 'Tap to answer'}
            </div>
          </div>
        </div>
        <div className="timer">
          <span className="tl">Elapsed</span>
          <span>{fmt(elapsed)}</span>
        </div>
        <Link href="/dashboard" className="btn btn-line">
          End Interview
        </Link>
      </div>
    </div>
  );
}
