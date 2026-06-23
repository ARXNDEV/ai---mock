import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { referralCodeFor } from '@/lib/referral';
import type { ProfileRow } from '@/lib/database.types';

/**
 * Returns the current user + their profile, or null if unauthenticated.
 *
 * Happy path performs NO writes: the `handle_new_user` trigger creates the row
 * (with referral_code + reset_date) at signup, and the monthly reset is applied
 * lazily by the atomic consume RPCs. We only fall back to writing for rows that
 * predate those guarantees (missing row / missing referral_code), and the
 * monthly rollover is reflected for display by computing effective usage in
 * memory rather than persisting it on every read.
 */
export async function getProfile(): Promise<{ userId: string; email: string | null; profile: ProfileRow } | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  let { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single();

  // Last-resort insert only if the trigger somehow didn't create the row
  // (e.g. a user that predates the trigger). Not the happy path.
  if (!profile) {
    const { data: created } = await admin
      .from('profiles')
      .insert({ id: user.id })
      .select('*')
      .single();
    profile = created ?? null;
  }
  if (!profile) return null;

  // One-time backfill for legacy rows created before referral codes existed.
  // New rows get their code from the trigger, so this never runs on the happy path.
  if (!profile.referral_code) {
    const { data: withCode } = await admin
      .from('profiles')
      .update({ referral_code: referralCodeFor(user.id) })
      .eq('id', user.id)
      .select('*')
      .single();
    if (withCode) profile = withCode;
  }

  // Monthly reset is persisted by the atomic consume RPCs on next use. For
  // display, reflect the rollover in memory without writing the profile.
  if (new Date(profile.reset_date).getTime() < Date.now()) {
    profile = { ...profile, interviews_used_this_month: 0, resumes_used_this_month: 0 };
  }

  return { userId: user.id, email: user.email ?? null, profile };
}
