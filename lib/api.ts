'use client';

import type { Feedback, Role, Difficulty, InterviewFocus, ResumeAnalysis, TailoredResume } from './types';

// Interview-session token issued by /api/interview/consume; the billable AI
// routes require it. Held for the duration of the single-page interview flow.
let interviewToken: string | null = null;
export function setInterviewToken(token: string | null): void {
  interviewToken = token;
}
function interviewHeaders(): Record<string, string> {
  return interviewToken ? { 'x-interview-token': interviewToken } : {};
}

function describeError(status: number, data: { error?: string; retryAfter?: number }): string {
  if (status === 429) {
    const wait = data.retryAfter ? ` Try again in ${data.retryAfter}s.` : '';
    return `${data.error || 'Too many requests.'}${wait}`;
  }
  return data.error || `Request failed (${status}).`;
}

async function postJson<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(describeError(res.status, data as { error?: string; retryAfter?: number }));
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
  const { question } = await postJson<{ question: string }>('/api/next-question', params, interviewHeaders());
  return question;
}

export async function fetchFollowUp(params: {
  role: Role;
  jd: string;
  question: string;
  transcript: string;
}): Promise<string> {
  const { question } = await postJson<{ question: string }>('/api/follow-up', params, interviewHeaders());
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
  return postJson<Feedback>('/api/evaluate', params, interviewHeaders());
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

  const res = await fetch('/api/transcribe', { method: 'POST', body: form, headers: interviewHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(describeError(res.status, data as { error?: string; retryAfter?: number }));
  }
  return (data as { transcript: string }).transcript;
}

/**
 * Reserve an interview credit + session token before starting. Returns
 * ok:false at the monthly limit. The returned token must be registered via
 * setInterviewToken() so the billable AI routes accept subsequent calls.
 */
export async function consumeInterviewCredit(questionCount?: number): Promise<{
  ok: boolean;
  remaining: number | null;
  plan: string;
  token?: string;
  error?: string;
}> {
  const res = await fetch('/api/interview/consume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionCount }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 403) {
    return { ok: false, remaining: data.remaining ?? 0, plan: data.plan ?? 'free', error: data.error };
  }
  if (!res.ok) {
    throw new Error(describeError(res.status, data as { error?: string; retryAfter?: number }));
  }
  return { ok: true, remaining: data.remaining ?? null, plan: data.plan ?? 'free', token: data.token };
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
