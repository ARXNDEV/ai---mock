import { Suspense } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import AuthForm from '@/components/auth/AuthForm';

export const dynamic = 'force-dynamic';

export default function SignupPage() {
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
            Create your account
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 6 }}>
            Start practicing in seconds — it&apos;s free.
          </p>
        </div>
        <Suspense fallback={<div style={{ height: 220 }} />}>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
      <p style={{ marginTop: 22, fontSize: 14, color: 'var(--ink-soft)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </main>
  );
}
