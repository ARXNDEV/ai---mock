import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = (await request
    .json()
    .catch(() => ({}))) as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment fields.' }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return NextResponse.json({ error: 'Razorpay is not configured.' }, { status: 500 });

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  // Timing-safe comparison.
  const valid =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));

  if (!valid) {
    return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update({ plan: 'pro' }).eq('id', user.id);
  if (error) {
    console.error('[razorpay verify] upgrade failed', error);
    return NextResponse.json({ error: 'Failed to upgrade plan.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
