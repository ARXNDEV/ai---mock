import type { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export function LegalShell({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="legal-wrap">
      <header className="legal-top">
        <Logo href="/" />
        <Link href="/" className="btn btn-line btn-sm">
          ← Home
        </Link>
      </header>

      <main className="legal">
        <div className="eyebrow">Legal</div>
        <h1>{title}</h1>
        <p className="legal-updated mono">Last updated: {updated}</p>
        <p className="legal-intro">{intro}</p>
        {children}
      </main>

      <footer className="legal-foot">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/security">Security</Link>
        <span>© 2026 Intervue.ai</span>
      </footer>
    </div>
  );
}
