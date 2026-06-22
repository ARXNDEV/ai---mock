import { NextResponse } from 'next/server';
import { getGroq, GROQ_LLM_MODEL, INTERVIEWER_SYSTEM_PROMPT } from '@/lib/groq';
import { buildEvaluationPrompt } from '@/lib/prompts';
import { extractJson } from '@/lib/json';
import { getUser } from '@/lib/auth';
import type { Role, Feedback } from '@/lib/types';

export const runtime = 'nodejs';

interface Body {
  question: string;
  transcript: string;
  role: Role;
  jd?: string;
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as Body;

    if (!body.question || !body.transcript || !body.role) {
      return NextResponse.json(
        { error: 'question, transcript, and role are required.' },
        { status: 400 },
      );
    }

    const prompt = buildEvaluationPrompt({
      role: body.role,
      jd: body.jd ?? '',
      question: body.question,
      transcript: body.transcript,
    });

    const completion = await getGroq().chat.completions.create({
      model: GROQ_LLM_MODEL,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: INTERVIEWER_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const parsed = extractJson<Partial<Feedback>>(text);

    // Normalize: clamp the score to 1-10 and guarantee string fields.
    const score = Math.max(1, Math.min(10, Math.round(Number(parsed.score) || 0)));
    const rubric = Array.isArray(parsed.rubric)
      ? parsed.rubric
          .filter((r) => r && typeof r.dimension === 'string')
          .slice(0, 4)
          .map((r) => ({
            dimension: String(r.dimension),
            score: Math.max(1, Math.min(10, Math.round(Number(r.score) || 0))),
            note: typeof r.note === 'string' ? r.note : '',
          }))
      : undefined;
    const feedback: Feedback = {
      score,
      good: parsed.good ?? '',
      missing: parsed.missing ?? '',
      suggestion: parsed.suggestion ?? '',
      ...(rubric && rubric.length ? { rubric } : {}),
    };

    return NextResponse.json(feedback);
  } catch (err) {
    console.error('[evaluate] error:', err);
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to evaluate answer: ${detail}` },
      { status: 500 },
    );
  }
}
