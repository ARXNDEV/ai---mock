import { NextResponse } from 'next/server';
import { getGroq, GROQ_LLM_MODEL } from '@/lib/groq';
import { buildResumePrompt } from '@/lib/prompts';
import { extractJson } from '@/lib/json';
import { getProfile } from '@/lib/profile';
import { createAdminClient } from '@/lib/supabase/admin';
import { FREE_MONTHLY_RESUMES } from '@/lib/plans';
import { isProActive } from '@/lib/entitlements';
import { rateLimit, AI_LIMITS } from '@/lib/ratelimit';
import type { ResumeAnalysis } from '@/lib/types';

export const runtime = 'nodejs';

interface Body {
  resume?: string;
  jd?: string;
}

export async function POST(request: Request) {
  try {
    const data = await getProfile();
    if (!data) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { profile, userId } = data;
    const limited = await rateLimit(request, userId, { name: 'resume', ...AI_LIMITS.resume });
    if (limited) return limited;
    const isPro = isProActive(profile);

    const body = (await request.json()) as Body;
    if (!body.resume || body.resume.trim().length < 40) {
      return NextResponse.json({ error: 'Please provide your full résumé text (at least a few lines).' }, { status: 400 });
    }

    // Reserve a résumé credit atomically BEFORE the costly model call.
    let remaining: number | null = null;
    if (!isPro) {
      const admin = createAdminClient();
      const { data: result, error: rpcErr } = await admin.rpc('consume_resume_credit', {
        p_user: userId,
        p_base: FREE_MONTHLY_RESUMES,
      });
      if (rpcErr) {
        console.error('[resume] rpc failed', rpcErr);
        return NextResponse.json({ error: 'Failed to analyze résumé.' }, { status: 500 });
      }
      const res = (result ?? { ok: false, remaining: 0 }) as { ok: boolean; remaining: number };
      if (!res.ok) {
        return NextResponse.json(
          {
            error: `You've used all ${FREE_MONTHLY_RESUMES} free résumé analyses this month. Upgrade to Pro for unlimited.`,
            remaining: 0,
          },
          { status: 403 },
        );
      }
      remaining = res.remaining;
    }

    const prompt = buildResumePrompt({ resume: body.resume, jd: body.jd ?? '' });
    const completion = await getGroq().chat.completions.create({
      model: GROQ_LLM_MODEL,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are an expert technical recruiter and resume coach.' },
        { role: 'user', content: prompt },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const analysis = extractJson<ResumeAnalysis>(text);
    if (typeof analysis.matchScore !== 'number') {
      throw new Error('Model did not return a valid analysis.');
    }

    return NextResponse.json({ analysis, remaining });
  } catch (err) {
    console.error('[resume] error:', err);
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to analyze résumé: ${detail}` }, { status: 500 });
  }
}
