import { NextResponse } from 'next/server';
import { getGroq, GROQ_LLM_MODEL } from '@/lib/groq';
import { buildResumePrompt } from '@/lib/prompts';
import { extractJson } from '@/lib/json';
import { getProfile } from '@/lib/profile';
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
    if (data.profile.plan !== 'pro') {
      return NextResponse.json({ error: 'Resume Analyzer is a Pro feature.' }, { status: 403 });
    }

    const body = (await request.json()) as Body;
    if (!body.resume || body.resume.trim().length < 40) {
      return NextResponse.json({ error: 'Please paste your full resume text.' }, { status: 400 });
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
    const result = extractJson<ResumeAnalysis>(text);
    if (typeof result.matchScore !== 'number') {
      throw new Error('Model did not return a valid analysis.');
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('[resume] error:', err);
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to analyze resume: ${detail}` }, { status: 500 });
  }
}
