'use client';

import { useEffect, useRef, useState } from 'react';
import type { AnswerRecord, Feedback, InterviewConfig } from '@/lib/types';
import { useRecorder } from '@/hooks/useRecorder';
import { transcribeAudio, evaluateAnswer } from '@/lib/api';
import FeedbackPanel from './FeedbackPanel';

type Phase = 'answering' | 'transcribing' | 'review' | 'evaluating' | 'feedback';

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
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
  const [phase, setPhase] = useState<Phase>('answering');
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const spokenRef = useRef(false);

  // Read the question aloud once when it first appears (best-effort browser TTS).
  useEffect(() => {
    if (spokenRef.current) return;
    spokenRef.current = true;
    speak(question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When a recording finishes, automatically send it for transcription.
  useEffect(() => {
    if (recorder.audioBlob && phase === 'answering') {
      void handleTranscribe(recorder.audioBlob);
    }
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
      setPhase('answering');
    }
  }

  async function handleEvaluate() {
    if (!transcript.trim()) {
      setError('Please provide an answer before submitting.');
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
      });
      setFeedback(fb);
      setPhase('feedback');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Evaluation failed.');
      setPhase('review');
    }
  }

  function handleReRecord() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setTranscript('');
    setError(null);
    recorder.reset();
    setPhase('answering');
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
          <span>
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-4">
          <p className="text-lg font-medium leading-relaxed text-slate-900">{question}</p>
          <button
            type="button"
            onClick={() => speak(question)}
            title="Hear the question"
            aria-label="Hear the question"
            className="shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            🔊
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {(phase === 'answering' || phase === 'transcribing') && (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {phase === 'transcribing' ? (
            <p className="text-sm text-slate-500">Transcribing your answer…</p>
          ) : recorder.isRecording ? (
            <>
              <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                <span className="h-3 w-3 animate-pulse rounded-full bg-red-600" />
                Recording…
              </div>
              <button
                type="button"
                onClick={recorder.stop}
                className="rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Stop &amp; Transcribe
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500">Record your spoken answer when ready.</p>
              <button
                type="button"
                onClick={recorder.start}
                className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                ● Start Recording
              </button>
              {recorder.error && <p className="text-xs text-red-600">{recorder.error}</p>}
            </>
          )}
        </div>
      )}

      {(phase === 'review' || phase === 'evaluating') && (
        <div className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <label htmlFor="transcript" className="block text-sm font-semibold text-slate-700">
            Your answer <span className="font-normal text-slate-400">(review &amp; edit before submitting)</span>
          </label>
          <textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={6}
            disabled={phase === 'evaluating'}
            className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReRecord}
              disabled={phase === 'evaluating'}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Re-record
            </button>
            <button
              type="button"
              onClick={handleEvaluate}
              disabled={phase === 'evaluating'}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {phase === 'evaluating' ? 'Evaluating…' : 'Submit for Feedback'}
            </button>
          </div>
        </div>
      )}

      {phase === 'feedback' && feedback && (
        <FeedbackPanel
          feedback={feedback}
          isLastQuestion={isLastQuestion}
          onNext={() => onNext({ question, transcript, feedback })}
        />
      )}
    </div>
  );
}
