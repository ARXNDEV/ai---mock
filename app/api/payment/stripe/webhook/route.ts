import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlanKey, proUntilFor, type PlanKey } from '@/lib/plans';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 });
  }

  // Raw body is required for signature verification.
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe webhook] signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId ?? session.client_reference_id ?? null;
    const planRaw = session.metadata?.plan;
    const plan: PlanKey = isPlanKey(planRaw) ? planRaw : 'pro_monthly';
    const admin = createAdminClient();

    // Idempotency gate: record the event; if it already exists, stop here.
    const { data: inserted, error: payErr } = await admin
      .from('payments')
      .upsert(
        {
          user_id: userId,
          provider: 'stripe',
          event_id: event.id,
          provider_ref: session.id,
          amount: session.amount_total ?? null,
          currency: session.currency ?? null,
          plan,
          status: 'completed',
        },
        { onConflict: 'provider,event_id', ignoreDuplicates: true },
      )
      .select('id');
    if (payErr) console.error('[stripe webhook] payment record failed', payErr);
    if (!inserted || inserted.length === 0) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (userId) {
      const { error } = await admin
        .from('profiles')
        .update({ plan: 'pro', pro_until: proUntilFor(plan) })
        .eq('id', userId);
      if (error) console.error('[stripe webhook] upgrade failed', error);
    }
  }

  return NextResponse.json({ received: true });
}
