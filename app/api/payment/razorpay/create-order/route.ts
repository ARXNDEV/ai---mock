import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getUser } from '@/lib/auth';
import { INR_PLANS, isPlanKey } from '@/lib/plans';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan } = (await request.json().catch(() => ({}))) as { plan?: string };
  if (!isPlanKey(plan)) {
    return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: 'Razorpay is not configured.' }, { status: 500 });
  }

  const cfg = INR_PLANS[plan];
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const order = await razorpay.orders.create({
      amount: cfg.amountPaise,
      currency: 'INR',
      receipt: `ai_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { userId: user.id, plan },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      plan,
    });
  } catch (err) {
    console.error('[razorpay create-order]', err);
    return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
  }
}
