import Link from 'next/link';
import { Lock } from 'lucide-react';

export function HistoryLockOverlay() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div className="auth-card" style={{ maxWidth: 380, textAlign: 'center', padding: '32px 28px' }}>
        <span
          style={{
            margin: '0 auto',
            display: 'grid',
            placeItems: 'center',
            width: 48,
            height: 48,
            borderRadius: 13,
            background: 'var(--accent-grad)',
            color: '#fff',
          }}
        >
          <Lock width={22} height={22} className="ico" />
        </span>
        <h3 className="serif" style={{ fontSize: 22, marginTop: 16 }}>
          Full history is a Pro feature
        </h3>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 8 }}>
          Upgrade to revisit every interview with detailed, expandable feedback.
        </p>
        <Link href="/pricing" className="btn btn-accent" style={{ marginTop: 18 }}>
          Upgrade to Pro →
        </Link>
      </div>
    </div>
  );
}
