-- ============================================================================
-- AceInterview — Supabase schema
-- Run this in the Supabase SQL editor (or via the CLI) once per project.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, holding plan + monthly usage.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  interviews_used_this_month integer not null default 0,
  resumes_used_this_month integer not null default 0,
  reset_date timestamptz not null default (now() + interval '1 month'),
  created_at timestamptz not null default now()
);

-- Migration for projects created before the Resume Analyzer (idempotent).
alter table public.profiles
  add column if not exists resumes_used_this_month integer not null default 0;

-- Referral system (idempotent).
alter table public.profiles
  add column if not exists bonus_interviews integer not null default 0;
alter table public.profiles
  add column if not exists referral_code text;
alter table public.profiles
  add column if not exists referred_by uuid references auth.users (id);
create unique index if not exists profiles_referral_code_key
  on public.profiles (referral_code);

-- ---------------------------------------------------------------------------
-- sessions: one row per completed mock interview.
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  difficulty text not null,
  overall_score real not null,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_id_created_at_idx
  on public.sessions (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Users may READ their own profile but NOT write it (plan/usage are mutated
-- only by the service role on the server). Users may read + insert their own
-- sessions.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "sessions_select_own" on public.sessions;
create policy "sessions_select_own"
  on public.sessions for select
  using (auth.uid() = user_id);

drop policy if exists "sessions_insert_own" on public.sessions;
create policy "sessions_insert_own"
  on public.sessions for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Auto-create a profile when a new auth user signs up.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
