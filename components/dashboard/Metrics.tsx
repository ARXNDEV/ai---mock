'use client';

import { useEffect, useState } from 'react';
import { Mic, Star, Flame, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const dur = 1000;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(value * eased);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{decimals ? display.toFixed(decimals) : Math.round(display)}</>;
}

interface MetricDef {
  icon: LucideIcon;
  label: string;
  value: number;
  decimals?: number;
  small?: string;
  trend: string;
}

export function Metrics({
  interviewsThisMonth,
  avgScore,
  streak,
  totalInterviews,
  remainingLabel,
}: {
  interviewsThisMonth: number;
  avgScore: number;
  streak: number;
  totalInterviews: number;
  remainingLabel: string;
}) {
  const metrics: MetricDef[] = [
    { icon: Mic, label: 'Interviews / month', value: interviewsThisMonth, trend: remainingLabel },
    {
      icon: Star,
      label: 'Average score',
      value: avgScore,
      decimals: 1,
      small: '/10',
      trend: totalInterviews ? `across ${totalInterviews} interviews` : 'no data yet',
    },
    {
      icon: Flame,
      label: 'Current streak',
      value: streak,
      small: 'days',
      trend: streak > 0 ? '🔥 keep it going' : 'start today',
    },
    { icon: BarChart3, label: 'Total interviews', value: totalInterviews, trend: 'all time' },
  ];

  return (
    <div className="metrics">
      {metrics.map((m) => (
        <div className="metric" key={m.label}>
          <div className="m-top">
            <div className="m-ico">
              <m.icon strokeWidth={1.6} />
            </div>
          </div>
          <div className="m-label">{m.label}</div>
          <div className="m-val num">
            <CountUp value={m.value} decimals={m.decimals} />
            {m.small && <small>{m.small}</small>}
          </div>
          <div className="m-trend">{m.trend}</div>
        </div>
      ))}
    </div>
  );
}
