'use client';

import { useState } from 'react';
import { Gift, Copy, Check, Share2 } from 'lucide-react';
import { REFERRAL_BONUS } from '@/lib/referral';

export function ReferralCard({
  code,
  referredCount,
  bonus,
}: {
  code: string;
  referredCount: number;
  bonus: number;
}) {
  const [copied, setCopied] = useState(false);

  const link = typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${code}` : `/signup?ref=${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function share() {
    const data = {
      title: 'Intervue.ai',
      text: `Practice interviews with AI on Intervue.ai — use my link and we both get +${REFERRAL_BONUS} interviews.`,
      url: link,
    };
    try {
      if (navigator.share) await navigator.share(data);
      else await copy();
    } catch {
      /* dismissed */
    }
  }

  return (
    <div className="quickstart" style={{ marginBottom: 42 }}>
      <span className="qs-eye serif">↗</span>
      <div className="qs-left">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Gift width={22} height={22} className="ico" style={{ color: '#f0573b' }} /> Invite friends, earn interviews
        </h3>
        <p>
          Share your link — you and your friend each get{' '}
          <strong style={{ color: 'var(--paper)' }}>+{REFERRAL_BONUS} interviews</strong> when they join.
        </p>
        <div style={{ display: 'flex', gap: 22, marginTop: 16 }}>
          <div>
            <div className="serif" style={{ fontSize: 30, lineHeight: 1, color: 'var(--paper)' }}>
              {referredCount}
            </div>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,236,227,0.55)', marginTop: 4 }}>
              Friends joined
            </div>
          </div>
          <div>
            <div className="serif" style={{ fontSize: 30, lineHeight: 1, color: 'var(--paper)' }}>
              +{bonus}
            </div>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,236,227,0.55)', marginTop: 4 }}>
              Bonus interviews
            </div>
          </div>
        </div>
      </div>
      <div className="qs-controls" style={{ flexDirection: 'column', alignItems: 'stretch', minWidth: 260 }}>
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: 'var(--paper)',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(240,236,227,0.25)',
            borderRadius: 'var(--r-sm)',
            padding: '12px 14px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {link}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-paper" style={{ flex: 1 }} onClick={copy}>
            {copied ? <Check width={16} height={16} /> : <Copy width={16} height={16} />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button type="button" className="btn btn-paper" style={{ flex: 'none', padding: '15px 16px' }} onClick={share} aria-label="Share">
            <Share2 width={16} height={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
