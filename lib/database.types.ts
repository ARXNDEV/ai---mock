export type Plan = 'free' | 'pro';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** One recorded question + answer + feedback within a session. */
export type SessionQuestion = {
  question: string;
  transcript: string;
  score: number;
  good: string;
  missing: string;
  suggestion: string;
  rubric?: { dimension: string; score: number; note: string }[];
};

// NOTE: these MUST be `type` aliases, not `interface`s. The Supabase typed
// client requires table Row/Insert/Update types to be assignable to
// `Record<string, unknown>`, which interfaces are not (no implicit index
// signature) — using `interface` collapses every query result to `never`.
export type ProfileRow = {
  id: string;
  plan: Plan;
  interviews_used_this_month: number;
  resumes_used_this_month: number;
  bonus_interviews: number;
  referral_code: string | null;
  referred_by: string | null;
  pro_until: string | null;
  reset_date: string;
  created_at: string;
};

export type InterviewSessionRow = {
  id: string;
  user_id: string;
  calls_remaining: number;
  expires_at: string;
  created_at: string;
};

export type SessionRow = {
  id: string;
  user_id: string;
  role: string;
  difficulty: string;
  overall_score: number;
  questions: Json;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          plan?: Plan;
          interviews_used_this_month?: number;
          resumes_used_this_month?: number;
          bonus_interviews?: number;
          referral_code?: string | null;
          referred_by?: string | null;
          pro_until?: string | null;
          reset_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan?: Plan;
          interviews_used_this_month?: number;
          resumes_used_this_month?: number;
          bonus_interviews?: number;
          referral_code?: string | null;
          referred_by?: string | null;
          pro_until?: string | null;
          reset_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      interview_sessions: {
        Row: InterviewSessionRow;
        Insert: {
          id?: string;
          user_id: string;
          calls_remaining: number;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          calls_remaining?: number;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: { key: string; window_start: string; count: number };
        Insert: { key: string; window_start?: string; count?: number };
        Update: { key?: string; window_start?: string; count?: number };
        Relationships: [];
      };
      sessions: {
        Row: SessionRow;
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          difficulty: string;
          overall_score: number;
          questions: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          difficulty?: string;
          overall_score?: number;
          questions?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      use_interview_session: {
        Args: { p_session: string; p_user: string };
        Returns: number | null;
      };
      rate_limit_hit: {
        Args: { p_key: string; p_max: number; p_window_sec: number };
        Returns: { allowed: boolean; remaining: number; retryAfter: number };
      };
      consume_interview_credit: {
        Args: { p_user: string; p_base: number };
        Returns: { ok: boolean; remaining: number };
      };
      consume_resume_credit: {
        Args: { p_user: string; p_base: number };
        Returns: { ok: boolean; remaining: number };
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
