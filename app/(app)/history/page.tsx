import { getProfile } from '@/lib/profile';
import { createClient } from '@/lib/supabase/server';
import type { SessionRow } from '@/lib/database.types';
import { DashShell } from '@/components/app/DashShell';
import { HistoryList } from '@/components/history/HistoryList';
import { HistoryLockOverlay } from '@/components/history/HistoryLockOverlay';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const data = await getProfile();
  if (!data) return null;
  const isPro = data.profile.plan === 'pro';

  const supabase = createClient();
  const { data: rows } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });
  const sessions = (rows ?? []) as SessionRow[];
  const visible = isPro ? sessions : sessions.slice(0, 3);

  return (
    <DashShell email={data.email ?? ''} plan={data.profile.plan}>
      <div className="dash-head">
        <div>
          <h1>Session history</h1>
          <div className="date">Every interview, with full feedback</div>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <div style={isPro ? undefined : { filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
          <HistoryList sessions={visible} />
        </div>
        {!isPro && <HistoryLockOverlay />}
      </div>
    </DashShell>
  );
}
