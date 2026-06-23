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
-- Anti-sybil: referrer's bonus only lands once the referee qualifies (Task 5).
alter table public.profiles
  add column if not exists referral_qualified boolean not null default false;

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
-- Atomic credit consumption (Task 4) — cap check + increment + monthly reset in
-- a single locked statement, so concurrent requests can't exceed the cap.
-- p_base is the plan's base allowance; the interview cap adds referral bonus.
-- Returns { ok, remaining }.
-- ---------------------------------------------------------------------------
create or replace function public.consume_interview_credit(p_user uuid, p_base int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  prof public.profiles%rowtype;
  cap int;
  new_used int;
begin
  select * into prof from public.profiles where id = p_user for update;
  if not found then
    return jsonb_build_object('ok', false, 'remaining', 0);
  end if;

  if prof.reset_date < now() then
    update public.profiles
      set interviews_used_this_month = 0, resumes_used_this_month = 0, reset_date = now() + interval '1 month'
      where id = p_user;
    prof.interviews_used_this_month := 0;
  end if;

  cap := p_base + coalesce(prof.bonus_interviews, 0);
  if prof.interviews_used_this_month >= cap then
    return jsonb_build_object('ok', false, 'remaining', 0);
  end if;

  update public.profiles
    set interviews_used_this_month = interviews_used_this_month + 1
    where id = p_user
    returning interviews_used_this_month into new_used;

  return jsonb_build_object('ok', true, 'remaining', greatest(0, cap - new_used));
end;
$$;

create or replace function public.consume_resume_credit(p_user uuid, p_base int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  prof public.profiles%rowtype;
  new_used int;
begin
  select * into prof from public.profiles where id = p_user for update;
  if not found then
    return jsonb_build_object('ok', false, 'remaining', 0);
  end if;

  if prof.reset_date < now() then
    update public.profiles
      set interviews_used_this_month = 0, resumes_used_this_month = 0, reset_date = now() + interval '1 month'
      where id = p_user;
    prof.resumes_used_this_month := 0;
  end if;

  if prof.resumes_used_this_month >= p_base then
    return jsonb_build_object('ok', false, 'remaining', 0);
  end if;

  update public.profiles
    set resumes_used_this_month = resumes_used_this_month + 1
    where id = p_user
    returning resumes_used_this_month into new_used;

  return jsonb_build_object('ok', true, 'remaining', greatest(0, p_base - new_used));
end;
$$;

-- ---------------------------------------------------------------------------
-- Referral claim + qualification (Task 5). Atomic, self-referral-safe, capped.
-- claim_referral binds referee→referrer and gives the referee a (capped)
-- welcome bonus; the REFERRER is credited only when the referee qualifies
-- (qualify_referral, called when they save their first session).
-- ---------------------------------------------------------------------------
create or replace function public.claim_referral(p_user uuid, p_code text, p_bonus int, p_cap int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.profiles%rowtype;
  ref public.profiles%rowtype;
begin
  select * into me from public.profiles where id = p_user for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'no-profile'); end if;
  if me.referred_by is not null then return jsonb_build_object('ok', false, 'reason', 'already-referred'); end if;

  select * into ref from public.profiles where referral_code = p_code;
  if not found or ref.id = p_user then return jsonb_build_object('ok', false, 'reason', 'invalid-code'); end if;

  update public.profiles
    set referred_by = ref.id,
        bonus_interviews = least(p_cap, coalesce(bonus_interviews, 0) + p_bonus)
    where id = p_user;

  return jsonb_build_object('ok', true, 'bonus', p_bonus);
end;
$$;

create or replace function public.qualify_referral(p_user uuid, p_bonus int, p_cap int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.profiles%rowtype;
begin
  select * into me from public.profiles where id = p_user for update;
  if not found or me.referred_by is null or me.referral_qualified then
    return jsonb_build_object('ok', false);
  end if;

  update public.profiles set referral_qualified = true where id = p_user;
  update public.profiles
    set bonus_interviews = least(p_cap, coalesce(bonus_interviews, 0) + p_bonus)
    where id = me.referred_by;

  return jsonb_build_object('ok', true);
end;
$$;

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
