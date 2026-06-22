import type { SessionRow } from '@/lib/database.types';

/**
 * Compact score-trend bar chart from recent sessions (oldest → newest).
 * Pure SVG, no chart library. Renders nothing until there are ≥2 sessions.
 */
export function ScoreTrend({ sessions }: { sessions: SessionRow[] }) {
  const recent = [...sessions]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-12);

  if (recent.length < 2) return null;

  const gap = 8;
  const barW = (100 - gap * (recent.length - 1)) / recent.length;
  const latest = recent[recent.length - 1].overall_score;

  return (
    <div className="metric" style={{ marginBottom: 40 }}>
      <div className="m-label" style={{ marginTop: 0 }}>
        Score trend · last {recent.length}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '6px 0 16px' }}>
        <span className="serif" style={{ fontSize: 40, lineHeight: 1 }}>
          {latest}
        </span>
        <span className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)' }}>
          latest
        </span>
      </div>
      <svg viewBox="0 0 100 44" preserveAspectRatio="none" style={{ width: '100%', height: 56, overflow: 'visible' }}>
        {recent.map((s, i) => {
          const h = Math.max(2, (s.overall_score / 10) * 40);
          const x = i * (barW + gap);
          const color = s.overall_score >= 7 ? 'var(--green)' : s.overall_score >= 5 ? 'var(--ochre)' : 'var(--accent)';
          return (
            <rect
              key={s.id}
              x={x}
              y={44 - h}
              width={barW}
              height={h}
              rx={1.5}
              fill={color}
              opacity={0.35 + (i / recent.length) * 0.65}
            />
          );
        })}
      </svg>
    </div>
  );
}
