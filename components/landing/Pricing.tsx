'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { INR_PLANS, USD_PLANS } from '@/lib/plans';

type Currency = 'inr' | 'usd';

export function Pricing() {
  const [cur, setCur] = useState<Currency>('inr');
  const plans = cur === 'inr' ? INR_PLANS : USD_PLANS;
  const free = cur === 'inr' ? '₹0' : '$0';

  return (
    <section className="section" id="pricing">
      <div className="sec-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            Pricing
          </div>
          <h2>
            Simple, <em>honest</em> pricing.
          </h2>
        </div>
        <div className="price-toggle">
          <button className={cur === 'inr' ? 'active' : ''} onClick={() => setCur('inr')}>
            ₹ Indian
          </button>
          <button className={cur === 'usd' ? 'active' : ''} onClick={() => setCur('usd')}>
            $ International
          </button>
        </div>
      </div>

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
            <li className="off">
              <X className="ico" /> No session history
            </li>
            <li className="off">
              <X className="ico" /> No resume analyzer
            </li>
          </ul>
          <Link href="/signup" className="btn btn-line" style={{ width: '100%' }}>
            Get Started
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
          <Link href="/pricing" className="btn btn-accent" style={{ width: '100%' }}>
            Upgrade to Pro
          </Link>
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
          <Link href="/pricing" className="btn btn-line" style={{ width: '100%' }}>
            Get Annual
          </Link>
        </div>
      </div>
    </section>
  );
}
