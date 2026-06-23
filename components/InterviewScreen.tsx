'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Mic, Code2 } from 'lucide-react';
import type { AnswerRecord, Feedback, InterviewConfig } from '@/lib/types';
import { ROLE_LABELS, DIFFICULTY_LABELS, CODE_LANGUAGES } from '@/lib/constants';
import { CodeEditor } from './interview/CodeEditor';
import { useRecorder } from '@/hooks/useRecorder';
import { useSpeechCaptions } from '@/hooks/useSpeechCaptions';
import { transcribeAudio, evaluateAnswer, fetchFollowUp } from '@/lib/api';
import { speak, cancelSpeech } from '@/lib/speech';
import { haptic } from '@/lib/haptics';
import { analyzeDelivery } from '@/lib/speechMetrics';
import { ScoreRing } from './interview/ScoreRing';
import { Waveform } from './interview/Waveform';
import { Typewriter } from './motion/Typewriter';

type Phase = 'idle' | 'transcribing' | 'review' | 'evaluating' | 'feedback';

const MUTE_KEY = 'intervue:tts-muted';

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
  onAnswerEvaluated,
  onEnd,
}: {
  config: InterviewConfig;
  question: string;
  questionNumber: number;
  totalQuestions: number;
  isLastQuestion: boolean;
  onNext: (record: AnswerRecord) => void;
  onAnswerEvaluated?: (transcript: string) => void;
  onEnd?: (record: AnswerRecord | null) => void;
}) {
  const recorder = useRecorder();
  const captions = useSpeechCaptions();
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [answerMode, setAnswerMode] = useState<'voice' | 'code'>('voice');
  const [language, setLanguage] = useState<string>('Python');
  const [activeQuestion, setActiveQuestion] = useState(question);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [mainRecord, setMainRecord] = useState<AnswerRecord | null>(null);
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spokenRef = useRef(false);
  const lastBlobRef = useRef<Blob | null>(null);
  const [transcribeFailed, setTranscribeFailed] = useState(false);

  // Speak the question once on mount (the AI interviewer asking it aloud).
  useEffect(() => {
    if (spokenRef.current) return;
    spokenRef.current = true;
    if (!muted) speak(question, { onStart: () => setAiSpeaking(true), onEnd: () => setAiSpeaking(false) });
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleMute() {
    setMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(MUTE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      if (next) {
        cancelSpeech();
        setAiSpeaking(false);
      } else {
        speak(question, { onStart: () => setAiSpeaking(true), onEnd: () => setAiSpeaking(false) });
      }
      return next;
    });
  }

  function toggleRecording() {
    haptic(12);
    if (recorder.isRecording) {
      recorder.stop();
      captions.stop();
    } else {
      cancelSpeech();
      setAiSpeaking(false);
      captions.reset();
      captions.start();
      recorder.start();
    }
  }

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

  // Surface mic / permission errors (otherwise tapping record silently fails).
  useEffect(() => {
    if (recorder.error) setError(recorder.error);
  }, [recorder.error]);

  async function handleTranscribe(blob: Blob) {
    lastBlobRef.current = blob;
    setPhase('transcribing');
    setError(null);
    try {
      const text = await transcribeAudio(blob);
      setTranscript(text);
      setTranscribeFailed(false);
      setPhase('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transcription failed.');
      setTranscribeFailed(true);
      recorder.reset(); // clear the blob so the auto-transcribe effect can't loop
      setPhase('idle');
    }
  }

  function switchMode(m: 'voice' | 'code') {
    if (m === answerMode) return;
    setAnswerMode(m);
    setError(null);
    setFeedback(null);
    setTranscript('');
    setElapsed(0);
    recorder.reset();
    captions.reset();
    cancelSpeech();
    setAiSpeaking(false);
    setPhase(m === 'code' ? 'review' : 'idle'); // code mode is editable immediately
  }

  async function handleEvaluate() {
    if (!transcript.trim()) {
      setError(answerMode === 'code' ? 'Please write some code first.' : 'Please record or type an answer first.');
      return;
    }
    setPhase('evaluating');
    setError(null);
    try {
      const fb = await evaluateAnswer({
        role: config.role,
        jd: config.jd,
        question,
        transcript,
        mode: answerMode,
        language: answerMode === 'code' ? language : undefined,
      });
      setFeedback(fb);
      setPhase('feedback');
      onAnswerEvaluated?.(transcript); // let the parent prefetch the next question
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Evaluation failed.');
      setPhase('review');
    }
  }

  // Drill into the just-given answer with a live follow-up. The original answer
  // is kept as the counted/saved record; the follow-up is bonus coaching.
  async function handleAskFollowUp() {
    if (!feedback) return;
    setMainRecord({ question, transcript, feedback });
    setLoadingFollowUp(true);
    setError(null);
    try {
      const fq = await fetchFollowUp({ role: config.role, jd: config.jd, question, transcript });
      cancelSpeech();
      setIsFollowUp(true);
      setActiveQuestion(fq);
      setTranscript('');
      setFeedback(null);
      setElapsed(0);
      recorder.reset();
      captions.reset();
      setPhase(answerMode === 'code' ? 'review' : 'idle');
      if (!muted) speak(fq, { onStart: () => setAiSpeaking(true), onEnd: () => setAiSpeaking(false) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load a follow-up.');
    } finally {
      setLoadingFollowUp(false);
    }
  }

  function recordToSave(): AnswerRecord | null {
    if (isFollowUp && mainRecord) return mainRecord;
    if (feedback) return { question, transcript, feedback };
    return null;
  }

  const recording = recorder.isRecording;
  // Delivery stats only make sense for a spoken answer (we have a recording time).
  const delivery = feedback && elapsed > 2 ? analyzeDelivery(transcript, elapsed) : null;
  const pct = Math.round((questionNumber / totalQuestions) * 100);
  const showTranscriptField = phase === 'review' || phase === 'evaluating' || phase === 'feedback';
  const statusText = aiSpeaking
    ? 'Asking the question…'
    : recording
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
            <div className={recording || aiSpeaking ? 'ai-avatar live' : 'ai-avatar'}>
              <svg className="ico" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="ai-name">Aria · AI Interviewer</div>
              <div className="ai-status">
                <span className="blip" /> {statusText}
              </div>
            </div>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Unmute interviewer voice' : 'Mute interviewer voice'}
              title={muted ? 'Unmute interviewer voice' : 'Mute interviewer voice'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--line)',
                background: 'var(--card)',
                color: muted ? 'var(--ink-mute)' : 'var(--accent)',
                cursor: 'pointer',
                flex: 'none',
              }}
            >
              {muted ? <VolumeX width={18} height={18} /> : <Volume2 width={18} height={18} />}
            </button>
          </div>

          <div className="q-card">
            <div className="q-tag">{isFollowUp ? '↪ Follow-up' : 'Current Question'}</div>
            <div className="q-text">
              <Typewriter text={activeQuestion} />
            </div>
            <div className="q-hint">
              <span className="qh-mark">✦</span> Take a moment to structure your answer — explain the{' '}
              <em>what</em>, then the <em>why</em>.
            </div>
          </div>

          <div className="transcript">
            <div className="t-head">
              <span>{answerMode === 'code' ? 'Your Code' : 'Live Transcript'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {recording && answerMode === 'voice' && (
                  <span className="live">
                    <span className="blip" /> Recording
                  </span>
                )}
                <div style={{ display: 'inline-flex', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => switchMode('voice')}
                    title="Voice / text answer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', fontSize: 11, border: 'none', cursor: 'pointer', background: answerMode === 'voice' ? 'var(--ink)' : 'transparent', color: answerMode === 'voice' ? 'var(--card)' : 'var(--ink-soft)' }}
                  >
                    <Mic width={13} height={13} /> Voice
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('code')}
                    title="Code answer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', fontSize: 11, border: 'none', cursor: 'pointer', background: answerMode === 'code' ? 'var(--ink)' : 'transparent', color: answerMode === 'code' ? 'var(--card)' : 'var(--ink-soft)' }}
                  >
                    <Code2 width={13} height={13} /> Code
                  </button>
                </div>
              </div>
            </div>

            {answerMode === 'code' ? (
              <div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mono"
                  style={{ marginBottom: 10, fontSize: 12, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--card)', color: 'var(--ink)' }}
                >
                  {CODE_LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <CodeEditor
                  value={transcript}
                  onChange={setTranscript}
                  placeholder={`Write your ${language} solution…`}
                  readOnly={phase === 'evaluating' || phase === 'feedback'}
                />
              </div>
            ) : (
              <>
                {recording && (
                  <div style={{ marginBottom: 14 }}>
                    <Waveform stream={recorder.stream} active={recording} />
                  </div>
                )}
                {showTranscriptField ? (
                  <textarea
                    className="t-text"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    readOnly={phase !== 'review'}
                    rows={5}
                    placeholder="Your answer…"
                  />
                ) : recording ? (
                  <div className="t-text">
                    <span style={{ color: captions.text ? 'var(--ink)' : 'var(--ink-mute)' }}>
                      {captions.text || 'Listening… speak your answer now.'}
                    </span>
                  </div>
                ) : (
                  <div className="t-text">
                    <span className="placeholder">
                      {phase === 'transcribing'
                        ? 'Transcribing your answer…'
                        : 'Your spoken answer will appear here. Tap the record button below to begin.'}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {error && (
            <div>
              <p className="mono" style={{ color: 'var(--accent)', fontSize: 13 }}>
                {error}
              </p>
              {transcribeFailed && lastBlobRef.current && (
                <button
                  type="button"
                  className="btn btn-line btn-sm"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    if (lastBlobRef.current) void handleTranscribe(lastBlobRef.current);
                  }}
                >
                  ↻ Retry transcription
                </button>
              )}
            </div>
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
              {feedback.rubric && feedback.rubric.length > 0 && (
                <div className="fb-block" style={{ paddingTop: 20, borderTop: '1px solid rgba(240,236,227,0.15)' }}>
                  <div className="fb-h" style={{ color: 'rgba(240,236,227,0.7)' }}>
                    <span className="dot" style={{ background: 'rgba(240,236,227,0.5)' }} /> Breakdown
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {feedback.rubric.map((r, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                          <span style={{ fontSize: 13, color: 'var(--paper)' }}>{r.dimension}</span>
                          <span className="mono" style={{ fontSize: 12, color: 'rgba(240,236,227,0.7)' }}>{r.score}/10</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: 'rgba(240,236,227,0.14)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${r.score * 10}%`, background: 'var(--accent-grad)', borderRadius: 3 }} />
                        </div>
                        {r.note && (
                          <div style={{ fontSize: 11.5, color: 'rgba(240,236,227,0.55)', marginTop: 5, lineHeight: 1.4 }}>
                            {r.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              {delivery && (
                <div className="fb-block" style={{ paddingTop: 20, borderTop: '1px solid rgba(240,236,227,0.15)' }}>
                  <div className="fb-h" style={{ color: 'rgba(240,236,227,0.7)' }}>
                    <span className="dot" style={{ background: 'rgba(240,236,227,0.5)' }} /> Delivery
                  </div>
                  <div style={{ display: 'flex', gap: 28 }}>
                    <div>
                      <div className="serif" style={{ fontSize: 28, color: 'var(--paper)', lineHeight: 1 }}>
                        {delivery.wpm}
                        <span style={{ fontSize: 13, color: 'rgba(240,236,227,0.5)' }}> wpm</span>
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: 9.5,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          marginTop: 5,
                          color: delivery.paceLabel === 'good' ? '#6cc79a' : '#e0a94b',
                        }}
                      >
                        {delivery.paceLabel === 'good'
                          ? 'Good pace'
                          : delivery.paceLabel === 'slow'
                            ? 'A bit slow'
                            : 'A bit fast'}
                      </div>
                    </div>
                    <div>
                      <div className="serif" style={{ fontSize: 28, color: 'var(--paper)', lineHeight: 1 }}>
                        {delivery.fillerCount}
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: 9.5,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          marginTop: 5,
                          color: 'rgba(240,236,227,0.5)',
                        }}
                      >
                        Filler{delivery.fillerCount === 1 ? '' : 's'}
                        {delivery.topFillers.length
                          ? ` · ${delivery.topFillers.map((f) => `"${f.word}"`).join(', ')}`
                          : ''}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
            <>
              {!isFollowUp && (
                <button className="btn btn-line" onClick={handleAskFollowUp} disabled={loadingFollowUp}>
                  {loadingFollowUp ? 'Loading follow-up…' : '↪ Ask a follow-up'}
                </button>
              )}
              <button
                className="btn btn-paper"
                onClick={() => {
                  const rec = recordToSave();
                  if (rec) onNext(rec);
                }}
              >
                {isLastQuestion ? 'See Summary →' : 'Next Question →'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="iv-bottom">
        {answerMode === 'voice' ? (
          <div className="rec-zone">
            <button
              className={recording ? 'rec-btn active' : 'rec-btn'}
              aria-label="Record"
              onClick={toggleRecording}
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
        ) : (
          <div className="rec-zone">
            <span style={{ display: 'grid', placeItems: 'center', width: 54, height: 54, borderRadius: 13, background: 'var(--card-2)', border: '1px solid var(--line)', color: 'var(--accent)' }}>
              <Code2 width={22} height={22} />
            </span>
            <div>
              <div className="rec-label">Coding mode</div>
              <div className="rec-sub">Write your solution, then “Submit for Feedback”</div>
            </div>
          </div>
        )}
        <div className="timer">
          <span className="tl">Elapsed</span>
          <span>{fmt(elapsed)}</span>
        </div>
        <button
          type="button"
          className="btn btn-line"
          onClick={() => onEnd?.(recordToSave())}
        >
          End &amp; See Summary
        </button>
      </div>
    </div>
  );
}
