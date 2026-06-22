import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { referralCodeFor } from '@/lib/referral';
import type { ProfileRow } from '@/lib/database.types';

function oneMonthFromNow(): string {
  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  return next.toISOString();
}

/**
 * Returns the current user + their profile, creating the profile if missing
 * and resetting the monthly interview counter when past the reset date.
 * Returns null if there is no authenticated user.
 */
export async function getProfile(): Promise<{ userId: string; email: string | null; profile: ProfileRow } | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

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

  if (profile && new Date(profile.reset_date).getTime() < Date.now()) {
    const { data: reset } = await admin
      .from('profiles')
      .update({ interviews_used_this_month: 0, resumes_used_this_month: 0, reset_date: oneMonthFromNow() })
      .eq('id', user.id)
      .select('*')
      .single();
    profile = reset ?? profile;
  }

  // Backfill a referral code once (best-effort — tolerate the column not existing).
  if (profile && !profile.referral_code) {
    const { data: withCode } = await admin
      .from('profiles')
      .update({ referral_code: referralCodeFor(user.id) })
      .eq('id', user.id)
      .select('*')
      .single();
    if (withCode) profile = withCode;
  }

  if (!profile) return null;
  return { userId: user.id, email: user.email ?? null, profile };
}
