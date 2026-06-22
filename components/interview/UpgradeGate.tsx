import Link from 'next/link';
import { Lock } from 'lucide-react';

export function UpgradeGate() {
  return (
    <div className="auth-card" style={{ maxWidth: 440, textAlign: 'center', padding: '40px 34px' }}>
      <span
        style={{
          margin: '0 auto',
          display: 'grid',
          placeItems: 'center',
          width: 52,
          height: 52,
          borderRadius: 13,
          background: 'var(--accent-grad)',
          color: '#fff',
        }}
      >
        <Lock width={24} height={24} className="ico" />
      </span>
      <h2 className="serif" style={{ fontSize: 26, marginTop: 18, lineHeight: 1.1 }}>
        You&apos;ve used all 3 free interviews
      </h2>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14.5, marginTop: 10, lineHeight: 1.6 }}>
        Your free interviews reset next month. Upgrade to Pro for unlimited practice, detailed
        feedback, and full history.
      </p>
      <Link href="/pricing" className="btn btn-accent" style={{ marginTop: 22 }}>
        Upgrade to Pro →
      </Link>
    </div>
  );
}
