export const FREE_MONTHLY_INTERVIEWS = 3;

export type PlanKey = 'pro_monthly' | 'pro_annual';

export interface InrPlan {
  key: PlanKey;
  label: string;
  amountPaise: number; // Razorpay charges in paise
  display: string;
  period: string;
}

export interface UsdPlan {
  key: PlanKey;
  label: string;
  amountCents: number; // Stripe charges in cents
  display: string;
  period: string;
}

export const INR_PLANS: Record<PlanKey, InrPlan> = {
  pro_monthly: { key: 'pro_monthly', label: 'Pro Monthly', amountPaise: 29900, display: '₹299', period: '/month' },
  pro_annual: { key: 'pro_annual', label: 'Pro Annual', amountPaise: 249900, display: '₹2,499', period: '/year' },
};

export const USD_PLANS: Record<PlanKey, UsdPlan> = {
  pro_monthly: { key: 'pro_monthly', label: 'Pro Monthly', amountCents: 400, display: '$4', period: '/month' },
  pro_annual: { key: 'pro_annual', label: 'Pro Annual', amountCents: 3400, display: '$34', period: '/year' },
};

export function isPlanKey(value: unknown): value is PlanKey {
  return value === 'pro_monthly' || value === 'pro_annual';
}
