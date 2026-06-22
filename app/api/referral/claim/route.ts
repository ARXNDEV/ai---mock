import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { REFERRAL_BONUS } from '@/lib/referral';

export const runtime = 'nodejs';

/**
 * Claim a referral code for the current user. Idempotent: only works once
 * (while the user has no `referred_by`), can't self-refer, and rewards BOTH
 * sides with bonus interviews. Always returns 200 with an `ok` flag so the
 * client can fire-and-forget.
 */
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { code } = (await request.json().catch(() => ({}))) as { code?: string };
    const clean = (code || '').trim().toUpperCase();
    if (!clean) return NextResponse.json({ ok: false, reason: 'no-code' });

    const admin = createAdminClient();

    const { data: me } = await admin
      .from('profiles')
      .select('id, referred_by, bonus_interviews')
      .eq('id', user.id)
      .single();
    if (!me) return NextResponse.json({ ok: false, reason: 'no-profile' });
    if (me.referred_by) return NextResponse.json({ ok: false, reason: 'already-referred' });

    const { data: referrer } = await admin
      .from('profiles')
      .select('id, bonus_interviews')
      .eq('referral_code', clean)
      .single();
    if (!referrer || referrer.id === user.id) {
      return NextResponse.json({ ok: false, reason: 'invalid-code' });
    }

    await admin
      .from('profiles')
      .update({ referred_by: referrer.id, bonus_interviews: (me.bonus_interviews ?? 0) + REFERRAL_BONUS })
      .eq('id', user.id);
    await admin
      .from('profiles')
      .update({ bonus_interviews: (referrer.bonus_interviews ?? 0) + REFERRAL_BONUS })
      .eq('id', referrer.id);

    return NextResponse.json({ ok: true, bonus: REFERRAL_BONUS });
  } catch (err) {
    console.error('[referral/claim] error', err);
    return NextResponse.json({ ok: false, reason: 'error' });
  }
}
