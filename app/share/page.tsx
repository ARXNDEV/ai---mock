import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { ROLE_LABELS, DIFFICULTY_LABELS } from '@/lib/constants';
import type { Role, Difficulty } from '@/lib/types';

export const dynamic = 'force-dynamic';

type SP = { score?: string; role?: string; diff?: string };

function parse(sp: SP) {
  const raw = parseFloat(sp.score ?? '');
  const score = Number.isFinite(raw) ? Math.max(0, Math.min(10, Math.round(raw * 10) / 10)) : null;
  const role = sp.role as Role | undefined;
  const diff = sp.diff as Difficulty | undefined;
  return {
    score,
    roleLabel: role && ROLE_LABELS[role] ? ROLE_LABELS[role] : null,
    diffLabel: diff && DIFFICULTY_LABELS[diff] ? DIFFICULTY_LABELS[diff] : null,
  };
}

export function generateMetadata({ searchParams }: { searchParams: SP }): Metadata {
  const { score, roleLabel } = parse(searchParams);
  const title =
    score !== null
      ? `I scored ${score}/10${roleLabel ? ` as a ${roleLabel}` : ''} on Intervue.ai`
      : 'Intervue.ai — AI Mock Interviews';
  const description = 'Practice with an AI interviewer, get instant feedback, and ace your next interview.';
  const ogImage = `/api/og?score=${searchParams.score ?? ''}&role=${searchParams.role ?? ''}&diff=${searchParams.diff ?? ''}`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default function SharePage({ searchParams }: { searchParams: SP }) {
  const { score, roleLabel, diffLabel } = parse(searchParams);
  const hi = score !== null && score >= 7;

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
      <div className="auth-card" style={{ width: '100%', maxWidth: 480, marginTop: 28, textAlign: 'center' }}>
        <div
          className="mono"
          style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}
        >
          Mock interview result
        </div>

        <div
          className="serif num"
          style={{ fontSize: 92, lineHeight: 1, marginTop: 10, color: hi ? 'var(--accent)' : 'var(--ink)' }}
        >
          {score !== null ? score : '—'}
          <span style={{ fontSize: 30, color: 'var(--ink-mute)' }}>/10</span>
        </div>

        {roleLabel && (
          <div className="serif" style={{ fontSize: 22, marginTop: 12, color: 'var(--ink)' }}>
            {diffLabel ? `${roleLabel} · ${diffLabel}` : roleLabel}
          </div>
        )}

        <p style={{ color: 'var(--ink-soft)', fontSize: 14.5, marginTop: 18, lineHeight: 1.5 }}>
          {hi
            ? 'Strong run. Think you can beat it? Take your own AI mock interview.'
            : 'Practice makes perfect. Take your own AI mock interview and track your score.'}
        </p>

        <Link href="/signup" className="btn btn-accent" style={{ width: '100%', marginTop: 22 }}>
          Start your own interview →
        </Link>
      </div>

      <p style={{ marginTop: 22, fontSize: 13, color: 'var(--ink-mute)' }}>
        Free to try · No credit card needed
      </p>
    </main>
  );
}
