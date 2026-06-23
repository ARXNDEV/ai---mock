import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { FREE_MONTHLY_INTERVIEWS } from '@/lib/plans';
import { MAX_QUESTIONS } from '@/lib/constants';
import { isProActive, signInterviewToken } from '@/lib/entitlements';

export const runtime = 'nodejs';

// Per-started-interview budget of AI calls (headroom for transcribe/evaluate/
// follow-up/re-records across each question). Bounds Groq spend per credit.
const CALLS_PER_QUESTION = 10;
const SESSION_TTL_MS = 3 * 60 * 60 * 1000; // 3h

type Admin = ReturnType<typeof createAdminClient>;

function oneMonthFromNow(): string {
  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  return next.toISOString();
}

/** Reserve a budgeted interview session and return a signed token for it. */
async function issueToken(admin: Admin, userId: string, calls: number): Promise<string | null> {
  const expISO = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const { data, error } = await admin
    .from('interview_sessions')
    .insert({ user_id: userId, calls_remaining: calls, expires_at: expISO })
    .select('id')
    .single();
  if (error || !data) {
    console.error('[interview/consume] session insert failed', error);
    return null;
  }
  return signInterviewToken({ userId, sessionId: data.id, exp: Date.now() + SESSION_TTL_MS });
}

/**
 * Reserve one interview credit (credit-on-start) and issue a session token that
 * the billable AI routes require. Pro (active) users skip the credit but still
 * get a token. All writes go through the service role.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { questionCount?: number };
  const qCount = Math.max(1, Math.min(15, Math.floor(Number(body.questionCount)) || MAX_QUESTIONS));

  const admin = createAdminClient();
  let { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) {
    const { data: created } = await admin
      .from('profiles')
      .insert({ id: user.id, reset_date: oneMonthFromNow() })
      .select('*')
      .single();
    profile = created ?? null;
  }
  if (!profile) return NextResponse.json({ error: 'Profile unavailable.' }, { status: 500 });

  if (isProActive(profile)) {
    const token = await issueToken(admin, user.id, qCount * CALLS_PER_QUESTION + 9999);
    if (!token) return NextResponse.json({ error: 'Failed to start interview.' }, { status: 500 });
    return NextResponse.json({ ok: true, plan: 'pro', remaining: null, token });
  }

  // Free plan: reserve a monthly credit atomically (cap + reset handled in SQL).
  const { data: result, error: rpcErr } = await admin.rpc('consume_interview_credit', {
    p_user: user.id,
    p_base: FREE_MONTHLY_INTERVIEWS,
  });
  if (rpcErr) {
    console.error('[interview/consume] rpc failed', rpcErr);
    return NextResponse.json({ error: 'Failed to start interview.' }, { status: 500 });
  }
  const res = (result ?? { ok: false, remaining: 0 }) as { ok: boolean; remaining: number };
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, plan: 'free', remaining: 0, error: 'Free interview limit reached.' },
      { status: 403 },
    );
  }

  const token = await issueToken(admin, user.id, qCount * CALLS_PER_QUESTION);
  if (!token) return NextResponse.json({ error: 'Failed to start interview.' }, { status: 500 });

  return NextResponse.json({ ok: true, plan: 'free', remaining: res.remaining, token });
}
