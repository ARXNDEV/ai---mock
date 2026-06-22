import { Suspense } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import AuthForm from '@/components/auth/AuthForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
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
      <div className="auth-card" style={{ width: '100%', maxWidth: 430, marginTop: 28 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 className="serif" style={{ fontSize: 30 }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 6 }}>
            Sign in to continue your interview prep.
          </p>
        </div>
        <Suspense fallback={<div style={{ height: 220 }} />}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
      <p style={{ marginTop: 22, fontSize: 14, color: 'var(--ink-soft)' }}>
        New here?{' '}
        <Link href="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>
          Create an account
        </Link>
      </p>
    </main>
  );
}
