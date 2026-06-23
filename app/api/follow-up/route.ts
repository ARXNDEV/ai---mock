import { NextResponse } from 'next/server';
import { buildFollowUpPrompt } from '@/lib/prompts';
import { completeJson } from '@/lib/llm';
import { getUser } from '@/lib/auth';
import { spendInterviewCall } from '@/lib/entitlements';
import { rateLimit, AI_LIMITS } from '@/lib/ratelimit';
import type { Role } from '@/lib/types';

export const runtime = 'nodejs';

/** Generic deepening probe used when the model's JSON can't be parsed. */
const FALLBACK_FOLLOW_UP =
  'Can you walk me through your reasoning in a bit more detail — especially any trade-offs you considered?';

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

    const limited = await rateLimit(request, user.id, { name: 'follow-up', ...AI_LIMITS['follow-up'] });
    if (limited) return limited;

    const spend = await spendInterviewCall(request, user.id);
    if (!spend.ok) return NextResponse.json({ error: spend.error }, { status: spend.status });

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

    const parsed = await completeJson<{ question: string }>(prompt, { maxTokens: 512 });
    const question = typeof parsed?.question === 'string' ? parsed.question.trim() : '';
    if (!question) {
      console.error('[follow-up] model JSON unusable; returning fallback follow-up');
      return NextResponse.json({ question: FALLBACK_FOLLOW_UP });
    }
    return NextResponse.json({ question });
  } catch (err) {
    console.error('[follow-up] error:', err);
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to generate follow-up: ${detail}` }, { status: 500 });
  }
}
