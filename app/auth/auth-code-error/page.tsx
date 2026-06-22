import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Logo } from '@/components/brand/logo';

export default function AuthCodeErrorPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
      }}
    >
      <Logo />
      <div className="auth-card" style={{ width: '100%', maxWidth: 430, marginTop: 28, textAlign: 'center' }}>
        <AlertTriangle width={44} height={44} style={{ margin: '0 auto', color: 'var(--ochre)' }} className="ico" />
        <h1 className="serif" style={{ fontSize: 24, marginTop: 16 }}>
          Sign-in link invalid or expired
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 8 }}>
          That magic link couldn&apos;t be verified. It may have expired or already been used.
        </p>
        <Link href="/login" className="btn btn-accent" style={{ marginTop: 20 }}>
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
