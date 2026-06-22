import { NextResponse } from 'next/server';
import { getGroq, GROQ_LLM_MODEL, INTERVIEWER_SYSTEM_PROMPT } from '@/lib/groq';
import { buildFollowUpPrompt } from '@/lib/prompts';
import { extractJson } from '@/lib/json';
import { getUser } from '@/lib/auth';
import type { Role } from '@/lib/types';

export const runtime = 'nodejs';

interface Body {
  role: Role;
  jd?: string;
  question: string;
  transcript: string;
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as Body;
    if (!body.role || !body.question || !body.transcript) {
      return NextResponse.json({ error: 'role, question, and transcript are required.' }, { status: 400 });
    }

    const prompt = buildFollowUpPrompt({
      role: body.role,
      jd: body.jd ?? '',
      question: body.question,
      transcript: body.transcript,
    });

    const completion = await getGroq().chat.completions.create({
      model: GROQ_LLM_MODEL,
      max_tokens: 512,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: INTERVIEWER_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const { question } = extractJson<{ question: string }>(text);
    if (!question || typeof question !== 'string') {
      throw new Error('Model did not return a follow-up.');
    }
    return NextResponse.json({ question: question.trim() });
  } catch (err) {
    console.error('[follow-up] error:', err);
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to generate follow-up: ${detail}` }, { status: 500 });
  }
}
