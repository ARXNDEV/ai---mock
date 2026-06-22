import { NextResponse } from 'next/server';
import { getGroq, GROQ_LLM_MODEL } from '@/lib/groq';
import { buildResumePrompt } from '@/lib/prompts';
import { extractJson } from '@/lib/json';
import { getProfile } from '@/lib/profile';
import { createAdminClient } from '@/lib/supabase/admin';
import { FREE_MONTHLY_RESUMES } from '@/lib/plans';
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
    const isPro = profile.plan === 'pro';
    const used = profile.resumes_used_this_month ?? 0;

    if (!isPro && used >= FREE_MONTHLY_RESUMES) {
      return NextResponse.json(
        {
          error: `You've used all ${FREE_MONTHLY_RESUMES} free résumé analyses this month. Upgrade to Pro for unlimited.`,
          remaining: 0,
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Body;
    if (!body.resume || body.resume.trim().length < 40) {
      return NextResponse.json({ error: 'Please provide your full résumé text (at least a few lines).' }, { status: 400 });
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

    // Count this analysis for free users (best-effort — tolerate the column
    // not existing yet so the feature works before the migration is run).
    let remaining: number | null = isPro ? null : Math.max(0, FREE_MONTHLY_RESUMES - used);
    if (!isPro) {
      const admin = createAdminClient();
      const { error: incErr } = await admin
        .from('profiles')
        .update({ resumes_used_this_month: used + 1 })
        .eq('id', userId);
      if (incErr) console.error('[resume] usage increment failed', incErr);
      else remaining = Math.max(0, FREE_MONTHLY_RESUMES - (used + 1));
    }

    return NextResponse.json({ analysis, remaining });
  } catch (err) {
    console.error('[resume] error:', err);
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to analyze résumé: ${detail}` }, { status: 500 });
  }
}
