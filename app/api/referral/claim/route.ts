import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { REFERRAL_BONUS, MAX_BONUS_INTERVIEWS } from '@/lib/referral';

export const runtime = 'nodejs';

/**
 * Claim a referral code. The whole claim runs in one atomic RPC: rejects a
 * second claim / self-referral / unknown code, binds referee→referrer, and
 * gives the referee a capped welcome bonus. The REFERRER's bonus is deferred
 * until the referee qualifies (saves their first session) — anti-sybil.
 * Always returns 200 + an `ok` flag for fire-and-forget on the client.
 */
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { code } = (await request.json().catch(() => ({}))) as { code?: string };
    const clean = (code || '').trim().toUpperCase();
    if (!clean) return NextResponse.json({ ok: false, reason: 'no-code' });

    const admin = createAdminClient();
    const { data, error } = await admin.rpc('claim_referral', {
      p_user: user.id,
      p_code: clean,
      p_bonus: REFERRAL_BONUS,
      p_cap: MAX_BONUS_INTERVIEWS,
    });
    if (error) {
      console.error('[referral/claim] rpc error', error);
      return NextResponse.json({ ok: false, reason: 'error' });
    }
    return NextResponse.json(data ?? { ok: false, reason: 'error' });
  } catch (err) {
    console.error('[referral/claim] error', err);
    return NextResponse.json({ ok: false, reason: 'error' });
  }
}
