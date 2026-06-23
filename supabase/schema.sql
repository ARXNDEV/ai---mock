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

-- Time-boxed Pro (Task 2): Pro is "active" when plan='pro' AND
-- (pro_until is null OR pro_until > now()). pro_until null = legacy/unbounded.
alter table public.profiles
  add column if not exists pro_until timestamptz;

-- ---------------------------------------------------------------------------
-- interview_sessions: a server-reserved budget of AI calls per started
-- interview. consume issues a signed token bound to one of these rows; each
-- billable AI call atomically decrements calls_remaining. Service-role only.
-- ---------------------------------------------------------------------------
create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  calls_remaining integer not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists interview_sessions_user_idx on public.interview_sessions (user_id);
alter table public.interview_sessions enable row level security;
-- No policies → only the service role can read/write these rows.

-- Atomically spend one AI call from a session. Returns the remaining count, or
-- NULL if the session is missing / not the user's / expired / exhausted.
create or replace function public.use_interview_session(p_session uuid, p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer;
begin
  update public.interview_sessions
    set calls_remaining = calls_remaining - 1
    where id = p_session
      and user_id = p_user
      and calls_remaining > 0
      and expires_at > now()
    returning calls_remaining into remaining;
  return remaining;
end;
$$;

-- ---------------------------------------------------------------------------
-- rate_limits: fixed-window counters (Task 3). Service-role only.
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);
alter table public.rate_limits enable row level security;
-- No policies → only the service role touches it.

-- Atomic fixed-window hit: increments (or rolls the window) and reports whether
-- this hit is allowed, plus remaining + seconds until the window resets.
create or replace function public.rate_limit_hit(p_key text, p_max int, p_window_sec int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ts timestamptz := now();
  new_count int;
  win_start timestamptz;
begin
  insert into public.rate_limits (key, window_start, count)
    values (p_key, now_ts, 1)
    on conflict (key) do update set
      count = case
        when public.rate_limits.window_start < now_ts - make_interval(secs => p_window_sec) then 1
        else public.rate_limits.count + 1 end,
      window_start = case
        when public.rate_limits.window_start < now_ts - make_interval(secs => p_window_sec) then now_ts
        else public.rate_limits.window_start end
    returning count, window_start into new_count, win_start;

  return jsonb_build_object(
    'allowed', new_count <= p_max,
    'remaining', greatest(0, p_max - new_count),
    'retryAfter', greatest(0, ceil(extract(epoch from (win_start + make_interval(secs => p_window_sec) - now_ts)))::int)
  );
end;
$$;

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
