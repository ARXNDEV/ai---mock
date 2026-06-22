import type { Role, Difficulty } from './types';

// Number of questions per interview session (Phase 1 MVP).
export const MAX_QUESTIONS = 5;

export const ROLES: { value: Role; label: string }[] = [
  { value: 'swe', label: 'Software Engineer' },
  { value: 'ml', label: 'ML Engineer' },
  { value: 'data-analyst', label: 'Data Analyst' },
  { value: 'pm', label: 'Product Manager' },
];

export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'fresher', label: 'Fresher' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
];

export const ROLE_LABELS: Record<Role, string> = {
  swe: 'Software Engineer',
  ml: 'ML Engineer',
  'data-analyst': 'Data Analyst',
  pm: 'Product Manager',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  fresher: 'Fresher',
  mid: 'Mid-level',
  senior: 'Senior',
};
