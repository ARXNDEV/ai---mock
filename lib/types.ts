// Shared types used by both client components and server routes.
// Keep this file free of any server-only imports so it is safe everywhere.

export type Role = 'swe' | 'ml' | 'data-analyst' | 'pm';

export type Difficulty = 'fresher' | 'mid' | 'senior';

export interface InterviewConfig {
  role: Role;
  difficulty: Difficulty;
  jd: string;
}

export interface Feedback {
  score: number; // 1-10
  good: string;
  missing: string;
  suggestion: string;
}

export interface AnswerRecord {
  question: string;
  transcript: string;
  feedback: Feedback;
}

export interface ResumeAnalysis {
  matchScore: number; // 0-100
  summary: string;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
}

export interface TailoredExperience {
  title: string;
  org: string;
  period: string;
  bullets: string[];
}

export interface TailoredResume {
  name: string;
  headline: string; // target role / title line
  summary: string;
  skills: string[];
  experience: TailoredExperience[];
  education: string[];
  atsKeywords: string[]; // JD keywords now covered
  changes: string[]; // what was improved / tailored
}
