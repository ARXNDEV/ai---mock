import 'server-only';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

/** Per-route limits: { perUser, perIp } requests per windowSec. */
export const AI_LIMITS = {
  'next-question': { perUser: 30, perIp: 60, windowSec: 60 },
  'follow-up': { perUser: 30, perIp: 60, windowSec: 60 },
  evaluate: { perUser: 30, perIp: 60, windowSec: 60 },
  transcribe: { perUser: 30, perIp: 60, windowSec: 60 },
  resume: { perUser: 10, perIp: 20, windowSec: 60 },
  'resume-build': { perUser: 10, perIp: 20, windowSec: 60 },
} as const;

export function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/** Atomic fixed-window check. Fails OPEN on limiter errors (never blocks app). */
export async function limit(key: string, opts: { max: number; windowSec: number }): Promise<RateLimitResult> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('rate_limit_hit', {
      p_key: key,
      p_max: opts.max,
      p_window_sec: opts.windowSec,
    });
    if (error || !data) {
      console.error('[ratelimit] rpc failed', error);
      return { allowed: true, remaining: opts.max, retryAfter: 0 };
    }
    return data as RateLimitResult;
  } catch (e) {
    console.error('[ratelimit] error', e);
    return { allowed: true, remaining: opts.max, retryAfter: 0 };
  }
}

export function tooMany(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests — slow down a moment.', retryAfter: result.retryAfter },
    { status: 429, headers: { 'Retry-After': String(result.retryAfter || 60) } },
  );
}

/**
 * Enforce per-user AND per-IP limits for a named route. Returns a 429 response
 * to short-circuit, or null when within limits.
 */
export async function rateLimit(
  request: Request,
  userId: string,
  cfg: { name: string; perUser: number; perIp: number; windowSec: number },
): Promise<NextResponse | null> {
  const ip = clientIp(request);
  const [u, i] = await Promise.all([
    limit(`${cfg.name}:u:${userId}`, { max: cfg.perUser, windowSec: cfg.windowSec }),
    limit(`${cfg.name}:ip:${ip}`, { max: cfg.perIp, windowSec: cfg.windowSec }),
  ]);
  if (!u.allowed) return tooMany(u);
  if (!i.allowed) return tooMany(i);
  return null;
}
