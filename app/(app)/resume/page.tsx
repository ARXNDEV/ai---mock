import { FileText } from 'lucide-react';
import { getProfile } from '@/lib/profile';
import { FREE_MONTHLY_RESUMES } from '@/lib/plans';
import { DashShell } from '@/components/app/DashShell';
import { ResumeAnalyzer } from '@/components/resume/ResumeAnalyzer';

export const dynamic = 'force-dynamic';

export default async function ResumePage() {
  const data = await getProfile();
  if (!data) return null;
  const { profile, email } = data;
  const isPro = profile.plan === 'pro';
  const remaining = isPro ? null : Math.max(0, FREE_MONTHLY_RESUMES - (profile.resumes_used_this_month ?? 0));

  return (
    <DashShell email={email ?? ''} plan={profile.plan}>
      <div className="dash-head">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileText width={30} height={30} className="ico" style={{ color: 'var(--accent)' }} />
            Resume Analyzer
          </h1>
          <div className="date">
            {isPro
              ? 'Pro · unlimited analyses'
              : `${remaining} of ${FREE_MONTHLY_RESUMES} free analyses left this month`}
          </div>
        </div>
      </div>
      <ResumeAnalyzer isPro={isPro} initialRemaining={remaining} />
    </DashShell>
  );
}
