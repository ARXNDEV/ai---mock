import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getUser } from '@/lib/auth';
import { limit, tooMany, clientIp } from '@/lib/ratelimit';

export const runtime = 'nodejs';

interface Body {
  email?: string;
  message?: string;
  turnstileToken?: string;
}

function makeTicketId(): string {
  const t = Date.now().toString(36).toUpperCase().slice(-4);
  const r = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `T-${t}${r}`;
}

/** Verify a Cloudflare Turnstile token (used to allow unauthenticated tickets). */
async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret || !token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const ip = clientIp(request);

  // Strict per-IP throttle: 5 tickets / hour.
  const rl = await limit(`support:ip:${ip}`, { max: 5, windowSec: 3600 });
  if (!rl.allowed) return tooMany(rl);

  const body = (await request.json().catch(() => null)) as Body | null;
  const email = body?.email?.trim() ?? '';
  const message = body?.message?.trim() ?? '';

  // Require either an authenticated user OR a verified captcha token.
  const user = await getUser();
  if (!user) {
    const human = await verifyTurnstile(body?.turnstileToken, ip);
    if (!human) {
      return NextResponse.json(
        { error: 'Please sign in (or complete the verification) to contact support.' },
        { status: 401 },
      );
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email so we can reply.' }, { status: 400 });
  }
  if (message.length < 5 || message.length > 5000) {
    return NextResponse.json({ error: 'Please describe your issue (5–5000 chars).' }, { status: 400 });
  }

  const inbox = process.env.SUPPORT_INBOX;
  const from = process.env.SUPPORT_FROM;
  const ticketId = makeTicketId();

  if (!process.env.RESEND_API_KEY || !inbox || !from) {
    console.error('[support] not configured (RESEND_API_KEY / SUPPORT_INBOX / SUPPORT_FROM)', { ticketId });
    return NextResponse.json({ error: 'not-configured', fallback: inbox ?? null }, { status: 503 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from,
      to: inbox,
      replyTo: email,
      subject: `[${ticketId}] Support request from ${email}`,
      text: `New support ticket from Intervue.ai\n\nTicket: ${ticketId}\nFrom: ${email}\nUser: ${user?.id ?? 'guest'}\n\nMessage:\n${message}\n\n— Reply directly to this email to respond to the user.`,
    });
    if (error) throw new Error(typeof error === 'string' ? error : error.message);
    return NextResponse.json({ ok: true, ticketId });
  } catch (err) {
    console.error('[support] send failed', err);
    return NextResponse.json({ error: 'Could not send your message right now.', fallback: inbox }, { status: 500 });
  }
}
