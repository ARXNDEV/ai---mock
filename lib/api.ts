'use client';

import type { Feedback, Role, Difficulty, InterviewFocus, ResumeAnalysis, TailoredResume } from './types';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status}).`);
  }
  return data as T;
}

export async function fetchNextQuestion(params: {
  role: Role;
  difficulty: Difficulty;
  jd: string;
  previousQuestions: string[];
  /** Optional: the candidate's last answer, so the next question can adapt to it. */
  lastAnswer?: string;
  focus?: InterviewFocus;
  resume?: string;
}): Promise<string> {
  const { question } = await postJson<{ question: string }>('/api/next-question', params);
  return question;
}

export async function fetchFollowUp(params: {
  role: Role;
  jd: string;
  question: string;
  transcript: string;
}): Promise<string> {
  const { question } = await postJson<{ question: string }>('/api/follow-up', params);
  return question;
}

export async function evaluateAnswer(params: {
  role: Role;
  jd: string;
  question: string;
  transcript: string;
  mode?: 'voice' | 'code';
  language?: string;
}): Promise<Feedback> {
  return postJson<Feedback>('/api/evaluate', params);
}

export async function analyzeResume(params: {
  resume: string;
  jd: string;
}): Promise<{ analysis: ResumeAnalysis; remaining: number | null }> {
  return postJson<{ analysis: ResumeAnalysis; remaining: number | null }>('/api/resume', params);
}

export async function buildTailoredResume(params: {
  resume: string;
  jd: string;
}): Promise<{ resume: TailoredResume; remaining: number | null }> {
  return postJson<{ resume: TailoredResume; remaining: number | null }>('/api/resume/build', params);
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const form = new FormData();
  const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
  form.append('audio', blob, `answer.${ext}`);

  const res = await fetch('/api/transcribe', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Transcription failed (${res.status}).`);
  }
  return (data as { transcript: string }).transcript;
}

/** Consume one interview credit (free plan) before starting. Returns ok:false at the limit. */
export async function consumeInterviewCredit(): Promise<{
  ok: boolean;
  remaining: number | null;
  plan: string;
  error?: string;
}> {
  const res = await fetch('/api/interview/consume', { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (res.status === 403) {
    return { ok: false, remaining: data.remaining ?? 0, plan: data.plan ?? 'free', error: data.error };
  }
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Could not start interview.');
  }
  return { ok: true, remaining: data.remaining ?? null, plan: data.plan ?? 'free' };
}

export async function claimReferral(code: string): Promise<{ ok: boolean; bonus?: number; reason?: string }> {
  return postJson<{ ok: boolean; bonus?: number; reason?: string }>('/api/referral/claim', { code });
}

export async function saveSession(payload: {
  role: string;
  difficulty: string;
  overall_score: number;
  questions: unknown;
}): Promise<void> {
  await postJson('/api/sessions', payload);
}
