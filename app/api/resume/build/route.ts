import { NextResponse } from 'next/server';
import { getGroq, GROQ_LLM_MODEL } from '@/lib/groq';
import { buildTailoredResumePrompt } from '@/lib/prompts';
import { extractJson } from '@/lib/json';
import { getProfile } from '@/lib/profile';
import { createAdminClient } from '@/lib/supabase/admin';
import { FREE_MONTHLY_RESUMES } from '@/lib/plans';
import type { TailoredResume } from '@/lib/types';

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
    const isPro = profile.plan === 'pro';
    const used = profile.resumes_used_this_month ?? 0;

    if (!isPro && used >= FREE_MONTHLY_RESUMES) {
      return NextResponse.json(
        {
          error: `You've used all ${FREE_MONTHLY_RESUMES} free résumé credits this month. Upgrade to Pro for unlimited.`,
          remaining: 0,
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Body;
    if (!body.resume || body.resume.trim().length < 40) {
      return NextResponse.json({ error: 'Please provide your full résumé text (at least a few lines).' }, { status: 400 });
    }

    const prompt = buildTailoredResumePrompt({ resume: body.resume, jd: body.jd ?? '' });
    const completion = await getGroq().chat.completions.create({
      model: GROQ_LLM_MODEL,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a world-class résumé writer and ATS optimization expert.' },
        { role: 'user', content: prompt },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? '';
    const resume = extractJson<TailoredResume>(text);
    if (!resume.summary || !Array.isArray(resume.experience)) {
      throw new Error('Model did not return a valid résumé.');
    }

    let remaining: number | null = isPro ? null : Math.max(0, FREE_MONTHLY_RESUMES - used);
    if (!isPro) {
      const admin = createAdminClient();
      const { error: incErr } = await admin
        .from('profiles')
        .update({ resumes_used_this_month: used + 1 })
        .eq('id', userId);
      if (incErr) console.error('[resume/build] usage increment failed', incErr);
      else remaining = Math.max(0, FREE_MONTHLY_RESUMES - (used + 1));
    }

    return NextResponse.json({ resume, remaining });
  } catch (err) {
    console.error('[resume/build] error:', err);
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to build résumé: ${detail}` }, { status: 500 });
  }
}
