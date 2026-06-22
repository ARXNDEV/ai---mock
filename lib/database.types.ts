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
  reset_date: string;
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
          reset_date?: string;
          created_at?: string;
        };
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
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
