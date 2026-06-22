'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Loader2 } from 'lucide-react';
import { INR_PLANS, USD_PLANS, type PlanKey } from '@/lib/plans';

type Currency = 'INR' | 'USD';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const faqs = [
  {
    q: 'How do the free interviews work?',
    a: 'Free accounts get 3 mock interviews every month. The counter resets automatically each month.',
  },
  {
    q: 'Can I pay in Indian Rupees?',
    a: 'Yes. Switch the toggle to ₹ Indian and you’ll check out securely via Razorpay. International users pay in USD via Stripe.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. Pro unlocks unlimited practice — there’s no lock-in, and you keep access for the period you paid for.',
  },
  {
    q: 'Is my interview data private?',
    a: 'Your sessions are tied to your account and only visible to you. We never share your answers.',
  },
];

export default function PricingClient({ isAuthed }: { isAuthed: boolean }) {
  const router = useRouter();
  const [cur, setCur] = useState<Currency>('INR');
  const [loading, setLoading] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plans = cur === 'INR' ? INR_PLANS : USD_PLANS;
  const free = cur === 'INR' ? '₹0' : '$0';

  async function payWithStripe(plan: PlanKey) {
    const res = await fetch('/api/payment/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) throw new Error(data.error || 'Could not start checkout.');
    window.location.href = data.url as string;
  }

  async function payWithRazorpay(plan: PlanKey) {
    const res = await fetch('/api/payment/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.orderId) throw new Error(data.error || 'Could not create order.');

    const ok = await loadRazorpayScript();
    if (!ok || !window.Razorpay) throw new Error('Could not load the Razorpay checkout.');

    const rzp = new window.Razorpay({
      key: data.keyId,
      order_id: data.orderId,
      amount: data.amount,
      currency: data.currency,
      name: 'Intervue.ai',
      description: INR_PLANS[plan].label,
      theme: { color: '#E5402B' },
      handler: async (response) => {
        const verify = await fetch('/api/payment/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response),
        });
        if (verify.ok) {
          router.push('/dashboard?upgraded=1');
          router.refresh();
        } else {
          const d = await verify.json().catch(() => ({}));
          setError(d.error || 'Payment verification failed.');
        }
      },
      modal: { ondismiss: () => setLoading(null) },
    });
    rzp.open();
  }

  async function upgrade(plan: PlanKey) {
    setError(null);
    if (!isAuthed) {
      router.push('/signup?redirectedFrom=/pricing');
      return;
    }
    setLoading(plan);
    try {
      if (cur === 'INR') await payWithRazorpay(plan);
      else await payWithStripe(plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed.');
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="sec-head" style={{ marginBottom: 8 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            Pricing
          </div>
          <h2 className="serif" style={{ fontSize: 'clamp(34px,5vw,52px)', fontWeight: 400, letterSpacing: '-0.01em' }}>
            Simple, <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>honest</em> pricing.
          </h2>
        </div>
        <div className="price-toggle">
          <button className={cur === 'INR' ? 'active' : ''} onClick={() => setCur('INR')}>
            ₹ Indian
          </button>
          <button className={cur === 'USD' ? 'active' : ''} onClick={() => setCur('USD')}>
            $ International
          </button>
        </div>
      </div>

      {error && (
        <p className="mono" style={{ color: 'var(--accent)', fontSize: 13, margin: '12px 0' }}>
          {error}
        </p>
      )}

      <div className="pricing-grid">
        <div className="price-card">
          <div className="plan-name">Free</div>
          <div className="plan-price">
            <span className="amt num">{free}</span>
            <span className="per">/ month</span>
          </div>
          <div className="plan-desc">For getting a feel of AI interviews.</div>
          <ul className="plan-feats">
            <li>
              <Check className="ico" /> 3 interviews / month
            </li>
            <li>
              <Check className="ico" /> Basic feedback
            </li>
            <li>
              <Check className="ico" /> All 4 roles
            </li>
          </ul>
          <Link href={isAuthed ? '/dashboard' : '/signup'} className="btn btn-line" style={{ width: '100%' }}>
            {isAuthed ? 'Go to dashboard' : 'Get Started'}
          </Link>
        </div>

        <div className="price-card featured">
          <div className="plan-badge">Most Popular</div>
          <div className="plan-name">Pro</div>
          <div className="plan-price">
            <span className="amt num">{plans.pro_monthly.display}</span>
            <span className="per">/ month</span>
          </div>
          <div className="plan-desc">For serious job seekers.</div>
          <ul className="plan-feats">
            <li>
              <Check className="ico" /> Unlimited interviews
            </li>
            <li>
              <Check className="ico" /> Detailed feedback
            </li>
            <li>
              <Check className="ico" /> Full session history
            </li>
            <li>
              <Check className="ico" /> Resume analyzer
            </li>
          </ul>
          <button className="btn btn-accent" style={{ width: '100%' }} onClick={() => upgrade('pro_monthly')} disabled={loading !== null}>
            {loading === 'pro_monthly' ? <Loader2 width={16} height={16} className="animate-spin" /> : 'Upgrade to Pro'}
          </button>
        </div>

        <div className="price-card">
          <div className="plan-name">
            Annual <span className="save-badge">SAVE 30%</span>
          </div>
          <div className="plan-price">
            <span className="amt num">{plans.pro_annual.display}</span>
            <span className="per">/ year</span>
          </div>
          <div className="plan-desc">Best value for the long haul.</div>
          <ul className="plan-feats">
            <li>
              <Check className="ico" /> Everything in Pro
            </li>
            <li>
              <Check className="ico" /> Priority support
            </li>
            <li>
              <Check className="ico" /> Early access features
            </li>
            <li>
              <Check className="ico" /> 30% annual discount
            </li>
          </ul>
          <button className="btn btn-line" style={{ width: '100%' }} onClick={() => upgrade('pro_annual')} disabled={loading !== null}>
            {loading === 'pro_annual' ? <Loader2 width={16} height={16} className="animate-spin" /> : 'Get Annual'}
          </button>
        </div>
      </div>

      <p className="mono" style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-mute)', marginTop: 18, letterSpacing: '0.04em' }}>
        {cur === 'INR' ? 'SECURE CHECKOUT IN ₹ VIA RAZORPAY' : 'SECURE CHECKOUT IN $ VIA STRIPE'}
      </p>

      <div style={{ maxWidth: 640, margin: '64px auto 0' }}>
        <h2 className="serif" style={{ fontSize: 32, textAlign: 'center', marginBottom: 22 }}>
          Frequently asked questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((f) => (
            <details
              key={f.q}
              className="feature"
              style={{ padding: '18px 22px', borderRadius: 13 }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 15, listStyle: 'none' }}>
                {f.q}
              </summary>
              <p style={{ marginTop: 10, color: 'var(--ink-soft)', fontSize: 14.5, lineHeight: 1.6 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
