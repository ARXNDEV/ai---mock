import { NextResponse } from 'next/server';
import { buildQuestionPrompt } from '@/lib/prompts';
import { completeJson } from '@/lib/llm';
import { getUser } from '@/lib/auth';
import { spendInterviewCall } from '@/lib/entitlements';
import { rateLimit, AI_LIMITS } from '@/lib/ratelimit';
import { ROLE_LABELS } from '@/lib/constants';
import type { Role, Difficulty, InterviewFocus } from '@/lib/types';

export const runtime = 'nodejs';

/** Sensible default when the model's JSON can't be parsed — keeps the interview going. */
function fallbackQuestion(role: Role): string {
  const label = ROLE_LABELS[role] ?? 'this role';
  return `Tell me about a challenging project relevant to ${label}, and how you approached the hardest part.`;
}

interface Body {
  role: Role;
  difficulty: Difficulty;
  jd?: string;
  previousQuestions?: string[];
  lastAnswer?: string;
  focus?: InterviewFocus;
  resume?: string;
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const limited = await rateLimit(request, user.id, { name: 'next-question', ...AI_LIMITS['next-question'] });
    if (limited) return limited;

    const spend = await spendInterviewCall(request, user.id);
    if (!spend.ok) return NextResponse.json({ error: spend.error }, { status: spend.status });

    const body = (await request.json()) as Body;

    if (!body.role || !body.difficulty) {
      return NextResponse.json(
        { error: 'role and difficulty are required.' },
        { status: 400 },
      );
    }

    const prompt = buildQuestionPrompt({
      role: body.role,
      difficulty: body.difficulty,
      jd: body.jd ?? '',
      previousQuestions: body.previousQuestions ?? [],
      lastAnswer: body.lastAnswer,
      focus: body.focus,
      resume: body.resume,
    });

    const parsed = await completeJson<{ question: string }>(prompt, { maxTokens: 1024 });
    const question = typeof parsed?.question === 'string' ? parsed.question.trim() : '';
    if (!question) {
      console.error('[next-question] model JSON unusable; returning fallback question');
      return NextResponse.json({ question: fallbackQuestion(body.role) });
    }

    return NextResponse.json({ question });
  } catch (err) {
    console.error('[next-question] error:', err);
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate question: ${detail}` },
      { status: 500 },
    );
  }
}
