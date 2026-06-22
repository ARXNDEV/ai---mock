import Link from 'next/link';
import { getProfile } from '@/lib/profile';
import { createClient } from '@/lib/supabase/server';
import { FREE_MONTHLY_INTERVIEWS } from '@/lib/plans';
import type { SessionRow } from '@/lib/database.types';
import type { Role, Difficulty } from '@/lib/types';
import { ROLE_LABELS, DIFFICULTY_LABELS } from '@/lib/constants';
import { DashShell } from '@/components/app/DashShell';
import { Metrics } from '@/components/dashboard/Metrics';
import { QuickStart } from '@/components/dashboard/QuickStart';

export const dynamic = 'force-dynamic';

function localDay(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function computeStreak(dates: string[]): number {
  const days = new Set(dates.map((d) => localDay(new Date(d))));
  if (days.size === 0) return 0;
  const oneDay = 86_400_000;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(localDay(cursor))) {
    cursor = new Date(cursor.getTime() - oneDay);
    if (!days.has(localDay(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(localDay(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - oneDay);
  }
  return streak;
}

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86_400_000;
  const days = Math.floor(diff / day);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (days < 30) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? '1 month ago' : `${months} months ago`;
}

export default async function DashboardPage() {
  const data = await getProfile();
  if (!data) return null;
  const { profile, email } = data;

  const supabase = createClient();
  const { data: rows } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  const sessions = (rows ?? []) as SessionRow[];

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = sessions.filter((s) => new Date(s.created_at) >= monthStart);
  const avg = sessions.length
    ? Math.round((sessions.reduce((acc, s) => acc + s.overall_score, 0) / sessions.length) * 10) / 10
    : 0;
  const streak = computeStreak(sessions.map((s) => s.created_at));

  const isPro = profile.plan === 'pro';
  const remaining = Math.max(0, FREE_MONTHLY_INTERVIEWS - profile.interviews_used_this_month);
  const remainingLabel = isPro ? 'unlimited plan' : `${remaining} of ${FREE_MONTHLY_INTERVIEWS} left`;

  const name = email ? email.split('@')[0] : 'there';
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = `${now.toLocaleDateString('en-US', { weekday: 'long' })} · ${now.toLocaleDateString(
    'en-US',
    { month: 'long', day: 'numeric', year: 'numeric' },
  )}`;

  return (
    <DashShell email={email ?? ''} plan={profile.plan}>
      <div className="dash-head">
        <div>
          <h1 style={{ textTransform: 'capitalize' }}>
            {greeting}, {name}.
          </h1>
          <div className="date">{dateStr}</div>
        </div>
        <Link href="/interview" className="btn btn-accent">
          + New Interview
        </Link>
      </div>

      <Metrics
        interviewsThisMonth={thisMonth.length}
        avgScore={avg}
        streak={streak}
        totalInterviews={sessions.length}
        remainingLabel={remainingLabel}
      />

      <QuickStart />

      <div className="sec-label">Recent Sessions</div>
      <div className="sessions">
        <div className="sess-thead">
          <span>Role</span>
          <span>Track</span>
          <span>Score</span>
          <span>When</span>
          <span />
        </div>
        {sessions.length ? (
          sessions.slice(0, 5).map((s) => (
            <div className="session-row" key={s.id}>
              <div className="s-role">{ROLE_LABELS[s.role as Role] ?? s.role}</div>
              <div className="s-sub">{DIFFICULTY_LABELS[s.difficulty as Difficulty] ?? s.difficulty}</div>
              <div className={`s-score num ${s.overall_score >= 7 ? 'hi' : 'mid'}`}>{s.overall_score}</div>
              <div className="s-time">{ago(s.created_at)}</div>
              <Link href="/history" className="s-view">
                View
              </Link>
            </div>
          ))
        ) : (
          <div className="mono" style={{ padding: '28px 26px', textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>
            No interviews yet — start your first one.
          </div>
        )}
      </div>

      {!isPro && (
        <div className="upgrade-banner">
          <div>
            <h3>
              Unlock unlimited interviews with <em>Pro</em>
            </h3>
            <p>Detailed feedback, full session history &amp; the resume analyzer — for ₹299/month.</p>
          </div>
          <Link href="/pricing" className="btn btn-accent">
            Upgrade Now →
          </Link>
        </div>
      )}
    </DashShell>
  );
}
