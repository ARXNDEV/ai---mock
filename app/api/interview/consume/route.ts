import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { FREE_MONTHLY_INTERVIEWS } from '@/lib/plans';

export const runtime = 'nodejs';

function oneMonthFromNow(): string {
  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  return next.toISOString();
}

/**
 * Consumes one interview credit for the current user (credit-on-start model).
 * Pro users always pass. Free users are incremented and rejected with 403 at
 * the monthly limit. All writes go through the service-role client.
 */
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  if (profile.plan === 'pro') {
    return NextResponse.json({ ok: true, plan: 'pro', remaining: null });
  }

  // Monthly allowance = base free + any bonus earned from referrals.
  const cap = FREE_MONTHLY_INTERVIEWS + (profile.bonus_interviews ?? 0);
  let used = profile.interviews_used_this_month;
  let resetDate = profile.reset_date;
  if (new Date(resetDate).getTime() < Date.now()) {
    used = 0;
    resetDate = oneMonthFromNow();
  }

  if (used >= cap) {
    if (resetDate !== profile.reset_date) {
      await admin
        .from('profiles')
        .update({ interviews_used_this_month: used, reset_date: resetDate })
        .eq('id', user.id);
    }
    return NextResponse.json(
      { ok: false, plan: 'free', remaining: 0, error: 'Free interview limit reached.' },
      { status: 403 },
    );
  }

  used += 1;
  const { error } = await admin
    .from('profiles')
    .update({ interviews_used_this_month: used, reset_date: resetDate })
    .eq('id', user.id);
  if (error) {
    console.error('[interview/consume] update failed', error);
    return NextResponse.json({ error: 'Failed to start interview.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    plan: 'free',
    remaining: Math.max(0, cap - used),
  });
}
