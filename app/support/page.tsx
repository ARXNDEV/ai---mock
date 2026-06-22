import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { SupportChat } from '@/components/support/SupportChat';

export const metadata: Metadata = {
  title: 'Contact Support — Intervue.ai',
  description: 'Questions, bugs, or billing — chat with Intervue.ai support and we’ll reply by email.',
};

export default function SupportPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <Logo href="/" />
      <h1 className="serif" style={{ fontSize: 'clamp(28px,4vw,40px)', margin: '20px 0 4px', textAlign: 'center' }}>
        How can we help?
      </h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 15, marginBottom: 24, textAlign: 'center' }}>
        Open a ticket below — or email{' '}
        <a href="mailto:iarunrao01@gmail.com" style={{ color: 'var(--accent)' }}>
          iarunrao01@gmail.com
        </a>
        .
      </p>
      <SupportChat />
      <p style={{ marginTop: 22, fontSize: 13, color: 'var(--ink-mute)' }}>
        <Link href="/" style={{ color: 'var(--accent)' }}>
          ← Back to home
        </Link>
      </p>
    </main>
  );
}
