import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ROLE_LABELS, DIFFICULTY_LABELS } from '@/lib/constants';
import { REFERRAL_BONUS, MAX_BONUS_INTERVIEWS } from '@/lib/referral';
import type { Json } from '@/lib/database.types';

export const runtime = 'nodejs';

interface Body {
  role?: string;
  difficulty?: string;
  overall_score?: number;
  questions?: Json;
}

// Bounds for the questions blob (the interview tops out at 10 questions; the
// headroom covers the coding round, and the byte cap stops oversized payloads).
const MAX_QUESTIONS = 20;
const MAX_QUESTIONS_BYTES = 100_000;

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(10, Math.max(0, n));
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Body | null;
  if (
    !body ||
    typeof body.role !== 'string' ||
    typeof body.difficulty !== 'string' ||
    typeof body.overall_score !== 'number'
  ) {
    return NextResponse.json({ error: 'Invalid session payload.' }, { status: 400 });
  }
  if (!Object.prototype.hasOwnProperty.call(ROLE_LABELS, body.role)) {
    return NextResponse.json({ error: 'Unknown role.' }, { status: 400 });
  }
  if (!Object.prototype.hasOwnProperty.call(DIFFICULTY_LABELS, body.difficulty)) {
    return NextResponse.json({ error: 'Unknown difficulty.' }, { status: 400 });
  }

  const questions = Array.isArray(body.questions) ? body.questions : [];
  if (questions.length > MAX_QUESTIONS) {
    return NextResponse.json({ error: 'Too many questions.' }, { status: 400 });
  }
  if (JSON.stringify(questions).length > MAX_QUESTIONS_BYTES) {
    return NextResponse.json({ error: 'Session payload too large.' }, { status: 400 });
  }

  // Don't trust the client's overall_score: recompute from per-question scores
  // when present, otherwise clamp whatever was sent into [0, 10].
  const perScores = questions
    .map((q) =>
      q && typeof q === 'object' && !Array.isArray(q) ? (q as { score?: unknown }).score : undefined,
    )
    .filter((s): s is number => typeof s === 'number' && Number.isFinite(s));
  const overall = perScores.length
    ? clampScore(perScores.reduce((a, b) => a + b, 0) / perScores.length)
    : clampScore(body.overall_score);

  // RLS guarantees the row is created for this user only.
  const { error } = await supabase.from('sessions').insert({
    user_id: user.id,
    role: body.role,
    difficulty: body.difficulty,
    overall_score: Math.round(overall * 10) / 10,
    questions,
  });

  if (error) {
    console.error('[sessions] insert failed', error);
    return NextResponse.json({ error: 'Failed to save session.' }, { status: 500 });
  }

  // Anti-sybil: credit the referrer the first time this user completes (saves)
  // an interview. Idempotent — qualify_referral only fires once per referee.
  try {
    await createAdminClient().rpc('qualify_referral', {
      p_user: user.id,
      p_bonus: REFERRAL_BONUS,
      p_cap: MAX_BONUS_INTERVIEWS,
    });
  } catch (e) {
    console.error('[sessions] qualify_referral failed', e);
  }

  return NextResponse.json({ ok: true });
}
