import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

// Where support tickets are delivered.
const SUPPORT_INBOX = 'iarunrao01@gmail.com';
// Resend's shared sender works without domain verification (delivers to the
// account owner's address). Swap to a verified domain sender once you have one.
const FROM = 'Intervue.ai Support <onboarding@resend.dev>';

interface Body {
  email?: string;
  message?: string;
}

function makeTicketId(): string {
  const t = Date.now().toString(36).toUpperCase().slice(-4);
  const r = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `T-${t}${r}`;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  const email = body?.email?.trim() ?? '';
  const message = body?.message?.trim() ?? '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email so we can reply.' }, { status: 400 });
  }
  if (message.length < 5) {
    return NextResponse.json({ error: 'Please describe your issue in a bit more detail.' }, { status: 400 });
  }

  const ticketId = makeTicketId();

  if (!process.env.RESEND_API_KEY) {
    // Not configured yet — let the client show a graceful fallback.
    console.error('[support] RESEND_API_KEY missing — cannot send ticket', { ticketId, email });
    return NextResponse.json({ error: 'not-configured', fallback: SUPPORT_INBOX }, { status: 503 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM,
      to: SUPPORT_INBOX,
      replyTo: email,
      subject: `[${ticketId}] Support request from ${email}`,
      text: `New support ticket from Intervue.ai\n\nTicket: ${ticketId}\nFrom: ${email}\n\nMessage:\n${message}\n\n— Reply directly to this email to respond to the user.`,
    });
    if (error) throw new Error(typeof error === 'string' ? error : error.message);
    return NextResponse.json({ ok: true, ticketId });
  } catch (err) {
    console.error('[support] send failed', err);
    return NextResponse.json({ error: 'Could not send your message right now.', fallback: SUPPORT_INBOX }, { status: 500 });
  }
}
