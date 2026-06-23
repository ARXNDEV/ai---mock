import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { getUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { INR_PLANS, isPlanKey, proUntilFor, type PlanKey } from '@/lib/plans';

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

  const keyId = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) return NextResponse.json({ error: 'Razorpay is not configured.' }, { status: 500 });

  // 1) Verify the HMAC signature (timing-safe).
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  const valid =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
  if (!valid) {
    return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 });
  }

  // 2) Fetch the order and bind it to THIS user + the expected amount (never trust the client).
  let order;
  try {
    order = await new Razorpay({ key_id: keyId, key_secret: secret }).orders.fetch(razorpay_order_id);
  } catch (err) {
    console.error('[razorpay verify] order fetch failed', err);
    return NextResponse.json({ error: 'Could not verify the order.' }, { status: 400 });
  }

  const notes = (order.notes ?? {}) as { userId?: string; plan?: string };
  if (notes.userId !== user.id) {
    return NextResponse.json({ error: 'Order does not belong to this user.' }, { status: 400 });
  }
  if (!isPlanKey(notes.plan)) {
    return NextResponse.json({ error: 'Unknown plan on order.' }, { status: 400 });
  }
  const plan: PlanKey = notes.plan;
  if (Number(order.amount) !== INR_PLANS[plan].amountPaise) {
    return NextResponse.json({ error: 'Order amount mismatch.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // 3) Idempotency + audit: record the payment; bail if already processed.
  const { data: inserted, error: payErr } = await admin
    .from('payments')
    .upsert(
      {
        user_id: user.id,
        provider: 'razorpay',
        event_id: razorpay_payment_id,
        provider_ref: razorpay_order_id,
        amount: Number(order.amount),
        currency: 'INR',
        plan,
        status: 'captured',
      },
      { onConflict: 'provider,event_id', ignoreDuplicates: true },
    )
    .select('id');
  if (payErr) console.error('[razorpay verify] payment record failed', payErr);
  if (!inserted || inserted.length === 0) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // 4) Grant the time-boxed pass.
  const { error } = await admin
    .from('profiles')
    .update({ plan: 'pro', pro_until: proUntilFor(plan) })
    .eq('id', user.id);
  if (error) {
    console.error('[razorpay verify] upgrade failed', error);
    return NextResponse.json({ error: 'Failed to upgrade plan.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
