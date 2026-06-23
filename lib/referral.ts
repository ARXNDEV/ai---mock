// Referral system constants + helpers (no server-only imports — safe anywhere).

/** Interviews granted to BOTH the referrer and the new user per successful referral. */
export const REFERRAL_BONUS = 2;

/** Hard cap on accumulated referral bonus_interviews (anti-farming). */
export const MAX_BONUS_INTERVIEWS = 20;

/** localStorage key used to carry a referral code through the signup/auth flow. */
export const REFERRAL_STORAGE_KEY = 'intervue:ref';

/** Deterministic, collision-resistant referral code derived from a user id. */
export function referralCodeFor(userId: string): string {
  return userId.replace(/-/g, '').slice(0, 8).toUpperCase();
}
