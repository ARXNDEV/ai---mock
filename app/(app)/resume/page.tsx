import Link from 'next/link';
import { FileText, Lock } from 'lucide-react';
import { getProfile } from '@/lib/profile';
import { DashShell } from '@/components/app/DashShell';
import { ResumeAnalyzer } from '@/components/resume/ResumeAnalyzer';

export const dynamic = 'force-dynamic';

function ResumeUpsell() {
  return (
    <div className="auth-card" style={{ maxWidth: 460, textAlign: 'center', padding: '40px 34px', margin: '0 auto' }}>
      <span
        style={{
          margin: '0 auto',
          display: 'grid',
          placeItems: 'center',
          width: 52,
          height: 52,
          borderRadius: 13,
          background: 'var(--accent-grad)',
          color: '#fff',
        }}
      >
        <Lock width={24} height={24} className="ico" />
      </span>
      <h2 className="serif" style={{ fontSize: 26, marginTop: 18, lineHeight: 1.1 }}>
        Resume Analyzer is a Pro feature
      </h2>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14.5, marginTop: 10, lineHeight: 1.6 }}>
        Upgrade to Pro to get an instant gap analysis of your resume against any job description —
        with prioritized, concrete fixes before you apply.
      </p>
      <Link href="/pricing" className="btn btn-accent" style={{ marginTop: 22 }}>
        Upgrade to Pro →
      </Link>
    </div>
  );
}

export default async function ResumePage() {
  const data = await getProfile();
  if (!data) return null;
  const { profile, email } = data;
  const isPro = profile.plan === 'pro';

  return (
    <DashShell email={email ?? ''} plan={profile.plan}>
      <div className="dash-head">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileText width={30} height={30} className="ico" style={{ color: 'var(--accent)' }} />
            Resume Analyzer
          </h1>
          <div className="date">Match your résumé to any job in seconds</div>
        </div>
      </div>
      {isPro ? <ResumeAnalyzer /> : <ResumeUpsell />}
    </DashShell>
  );
}
