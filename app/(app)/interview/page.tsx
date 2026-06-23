import { getProfile } from '@/lib/profile';
import { FREE_MONTHLY_INTERVIEWS } from '@/lib/plans';
import type { Role, Difficulty } from '@/lib/types';
import InterviewApp from '@/components/interview/InterviewApp';
import { UpgradeGate } from '@/components/interview/UpgradeGate';

export const dynamic = 'force-dynamic';

const VALID_ROLES: Role[] = ['swe', 'ml', 'data-analyst', 'pm'];
const VALID_DIFFICULTIES: Difficulty[] = ['fresher', 'mid', 'senior'];

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: { role?: string; difficulty?: string };
}) {
  const data = await getProfile();
  if (!data) return null;

  const isPro = data.profile.plan === 'pro';
  // Free allowance includes any referral bonus (matches the consume route).
  const cap = FREE_MONTHLY_INTERVIEWS + (data.profile.bonus_interviews ?? 0);
  const remaining = isPro ? null : Math.max(0, cap - data.profile.interviews_used_this_month);

  if (!isPro && remaining === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px 24px' }}>
        <UpgradeGate />
      </div>
    );
  }

  const role = VALID_ROLES.includes(searchParams.role as Role) ? (searchParams.role as Role) : 'swe';
  const difficulty = VALID_DIFFICULTIES.includes(searchParams.difficulty as Difficulty)
    ? (searchParams.difficulty as Difficulty)
    : 'mid';

  const userName = data.email ? data.email.split('@')[0] : 'there';

  return (
    <InterviewApp
      isPro={isPro}
      remaining={remaining}
      initialRole={role}
      initialDifficulty={difficulty}
      userName={userName}
    />
  );
}
