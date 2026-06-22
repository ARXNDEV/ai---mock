import { ImageResponse } from 'next/og';
import { ROLE_LABELS, DIFFICULTY_LABELS } from '@/lib/constants';
import type { Role, Difficulty } from '@/lib/types';

export const runtime = 'edge';

// Brand palette (mirrors globals.css)
const PAPER = '#F0ECE3';
const INK = '#1A1712';
const INK_MUTE = '#9c9587';
const ACCENT = '#E5402B';

/** Pull the brand serif (Instrument Serif) for the big numerals. Best-effort. */
async function loadSerif(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch('https://fonts.googleapis.com/css2?family=Instrument+Serif').then((r) =>
      r.text(),
    );
    const url = css.match(/src:\s*url\((https:[^)]+\.(?:ttf|otf|woff2?))\)/)?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);

  const raw = parseFloat(searchParams.get('score') ?? '');
  const score = Number.isFinite(raw) ? Math.max(0, Math.min(10, Math.round(raw * 10) / 10)) : null;
  const role = searchParams.get('role') as Role | null;
  const diff = searchParams.get('diff') as Difficulty | null;
  const roleLabel = role && ROLE_LABELS[role] ? ROLE_LABELS[role] : 'Mock Interview';
  const diffLabel = diff && DIFFICULTY_LABELS[diff] ? DIFFICULTY_LABELS[diff] : null;
  const scoreColor = score !== null && score >= 7 ? ACCENT : INK;
  const serif = await loadSerif();
  const serifFamily = serif ? 'Instrument Serif' : 'serif';

  const element = (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: PAPER,
        padding: 72,
      }}
    >
      {/* Header: logo + wordmark */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${origin}/logo-arrow.png`} width={60} height={56} alt="" />
        <div style={{ display: 'flex', fontSize: 42, marginLeft: 16, fontFamily: serifFamily, color: INK }}>
          Intervue<span style={{ color: ACCENT }}>.ai</span>
        </div>
      </div>

      {/* Center: the score */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            letterSpacing: '7px',
            color: INK_MUTE,
            textTransform: 'uppercase',
          }}
        >
          Mock Interview Result
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 4 }}>
          <div style={{ display: 'flex', fontSize: 210, lineHeight: 1, fontFamily: serifFamily, color: scoreColor }}>
            {score !== null ? score : '—'}
          </div>
          <div style={{ display: 'flex', fontSize: 70, color: INK_MUTE, marginLeft: 10, marginBottom: 34, fontFamily: serifFamily }}>
            /10
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 46, marginTop: 6, fontFamily: serifFamily, color: INK }}>
          {diffLabel ? `${roleLabel} · ${diffLabel}` : roleLabel}
        </div>
      </div>

      {/* Footer: CTA */}
      <div style={{ display: 'flex', fontSize: 28, color: INK_MUTE }}>
        Practice with an AI interviewer → intervue.ai
      </div>
    </div>
  );

  const fonts = serif
    ? [{ name: 'Instrument Serif', data: serif, style: 'normal' as const, weight: 400 as const }]
    : [];
  try {
    return new ImageResponse(element, { width: 1200, height: 630, fonts });
  } catch {
    return new ImageResponse(element, { width: 1200, height: 630 });
  }
}
