import type { Role, Difficulty, InterviewFocus } from './types';

// Default number of questions per interview session.
export const MAX_QUESTIONS = 5;

export const QUESTION_COUNTS = [3, 5, 10];

export const FOCUSES: { value: InterviewFocus; label: string }[] = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'technical', label: 'Technical' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'system-design', label: 'System Design' },
];

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
