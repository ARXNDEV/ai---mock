import 'server-only';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { FREE_MONTHLY_INTERVIEWS } from '@/lib/plans';

type ProLike = { plan: string; pro_until?: string | null };

/** Pro is active only when flagged Pro AND not expired (null = legacy/unbounded). */
export function isProActive(profile: ProLike): boolean {
  if (profile.plan !== 'pro') return false;
  if (!profile.pro_until) return true;
  return new Date(profile.pro_until).getTime() > Date.now();
}

/**
 * Read-only entitlement check for billable AI use. Loads the profile via the
 * service role and returns the plan + remaining free allowance (null for Pro).
 * Does NOT write — credit reservation happens atomically in /interview/consume.
 */
export async function assertAIAllowed(
  userId: string,
): Promise<{ plan: 'free' | 'pro'; remaining: number | null }> {
  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('*').eq('id', userId).single();
  if (!profile) return { plan: 'free', remaining: 0 };
  if (isProActive(profile)) return { plan: 'pro', remaining: null };

  const cap = FREE_MONTHLY_INTERVIEWS + (profile.bonus_interviews ?? 0);
  // Effective "used" resets when the monthly window has passed (read-only).
  const used = new Date(profile.reset_date).getTime() < Date.now() ? 0 : profile.interviews_used_this_month;
  return { plan: 'free', remaining: Math.max(0, cap - used) };
}

// ---------------------------------------------------------------------------
// Interview-session token (HMAC). One credit reservation -> one token bound to
// an interview_sessions row with a budget of AI calls. Falls back to the
// service-role key as the signing secret if INTERVIEW_TOKEN_SECRET is unset, so
// the system never silently breaks (still server-only, high-entropy).
// ---------------------------------------------------------------------------
function tokenSecret(): string {
  return process.env.INTERVIEW_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export function signInterviewToken(payload: { userId: string; sessionId: string; exp: number }): string {
  const body = `${payload.userId}.${payload.sessionId}.${payload.exp}`;
  const sig = crypto.createHmac('sha256', tokenSecret()).update(body).digest('base64url');
  return `${Buffer.from(body).toString('base64url')}.${sig}`;
}

function verifyInterviewToken(token: string | null, userId: string): { sessionId: string } | null {
  const secret = tokenSecret();
  if (!token || !secret) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const b64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let body: string;
  try {
    body = Buffer.from(b64, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const [tUser, sessionId, expStr] = body.split('.');
  if (tUser !== userId || !sessionId) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  return { sessionId };
}

/**
 * Gate a billable mid-interview AI call: verify the x-interview-token header and
 * atomically spend one unit of the session's budget. Returns a 403 result for
 * a missing/forged/expired/exhausted token so the route can bail before Groq.
 */
export async function spendInterviewCall(
  request: Request,
  userId: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const v = verifyInterviewToken(request.headers.get('x-interview-token'), userId);
  if (!v) return { ok: false, status: 403, error: 'Missing or invalid interview session token.' };

  const admin = createAdminClient();
  const { data: remaining, error } = await admin.rpc('use_interview_session', {
    p_session: v.sessionId,
    p_user: userId,
  });
  if (error) {
    console.error('[entitlements] use_interview_session failed', error);
    return { ok: false, status: 500, error: 'Interview session check failed.' };
  }
  if (remaining === null || remaining === undefined) {
    return { ok: false, status: 403, error: 'Interview session expired or exhausted.' };
  }
  return { ok: true };
}
