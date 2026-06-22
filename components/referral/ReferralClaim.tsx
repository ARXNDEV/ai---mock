'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { claimReferral } from '@/lib/api';
import { REFERRAL_STORAGE_KEY } from '@/lib/referral';

/**
 * Fire-and-forget: if a referral code was stashed at signup, claim it once the
 * user is authenticated (rewards both sides), clear it, and refresh so the new
 * bonus shows. Renders nothing.
 */
export function ReferralClaim() {
  const router = useRouter();
  useEffect(() => {
    let code: string | null = null;
    try {
      code = localStorage.getItem(REFERRAL_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (!code) return;
    try {
      localStorage.removeItem(REFERRAL_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    claimReferral(code)
      .then((res) => {
        if (res?.ok) router.refresh();
      })
      .catch(() => {});
  }, [router]);

  return null;
}
