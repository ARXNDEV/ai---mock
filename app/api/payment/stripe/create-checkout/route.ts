import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUser } from '@/lib/auth';
import { USD_PLANS, isPlanKey } from '@/lib/plans';

export const runtime = 'nodejs';

function baseUrl(request: Request): string {
  const origin = request.headers.get('origin');
  if (origin) return origin;
  const host = request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  return host ? `${proto}://${host}` : 'http://localhost:3000';
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan } = (await request.json().catch(() => ({}))) as { plan?: string };
  if (!isPlanKey(plan)) {
    return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
  }

  const cfg = USD_PLANS[plan];
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = baseUrl(request);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: cfg.amountCents,
            product_data: { name: `Intervue.ai ${cfg.label}` },
          },
        },
      ],
      success_url: `${origin}/dashboard?upgraded=1`,
      cancel_url: `${origin}/pricing?canceled=1`,
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: { userId: user.id, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[stripe create-checkout]', err);
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 });
  }
}
