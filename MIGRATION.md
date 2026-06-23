# Migration — security hardening (Tasks 1–9)

Run these steps **in order** when deploying this batch. The SQL is idempotent
(`create … if not exists`, `add column if not exists`, `create or replace`), so
re-running it is safe.

---

## 1. Database — run `supabase/schema.sql`

Open the **Supabase SQL editor** and run the entire contents of
[`supabase/schema.sql`](supabase/schema.sql). Nothing is dropped or rewritten
destructively. This batch introduces:

| Object | Kind | Task | Purpose |
| --- | --- | --- | --- |
| `profiles.pro_until` | column (`timestamptz`) | 2 | Time-boxed Pro expiry |
| `profiles.referral_qualified` | column (`boolean`) | 5 | Anti-sybil referral gate |
| `interview_sessions` | table + RLS (service-role only) | 1 | Per-interview AI-call budget |
| `use_interview_session(p_session, p_user)` | RPC | 1 | Atomically spend one AI call |
| `rate_limits` | table + RLS (service-role only) | 3 | Fixed-window counters |
| `rate_limit_hit(p_key, p_max, p_window_sec)` | RPC | 3 | Atomic rate-limit hit |
| `consume_interview_credit(p_user, p_base)` | RPC | 4 | Atomic cap-check + reset + increment |
| `consume_resume_credit(p_user, p_base)` | RPC | 4 | Same, for resume credits |
| `claim_referral(p_user, p_code, p_bonus, p_cap)` | RPC | 5 | Atomic, capped referral claim |
| `qualify_referral(p_user, p_bonus, p_cap)` | RPC | 5 | Credit referrer once referee qualifies |
| `payments` | table + select-own RLS | 6 | Payment audit trail; `unique(provider, event_id)` for idempotency |
| `handle_new_user()` | trigger fn (updated) | 9 | Now sets `referral_code` + `reset_date` at signup |

> The trigger change means **new** signups get their referral code at creation.
> Existing rows are backfilled lazily on first profile read (one write per legacy
> user, never on the happy path).

---

## 2. Vercel — environment variables

Add/confirm these under **Project → Settings → Environment Variables** (Production
+ Preview), then redeploy.

### New in this batch

| Var | Required? | Notes |
| --- | --- | --- |
| `INTERVIEW_TOKEN_SECRET` | Recommended | HMAC secret for the interview-session token gating billable AI routes. Generate: `openssl rand -base64 48`. Falls back to `SUPABASE_SERVICE_ROLE_KEY` if unset, but set a dedicated one in production. |
| `SUPPORT_INBOX` | Required for support form | Destination address for support tickets. If unset, `/api/support` returns 503 (no hardcoded inbox). |
| `SUPPORT_FROM` | Optional | From address. Defaults to `Intervue.ai Support <onboarding@resend.dev>` (works without a verified domain). |
| `TURNSTILE_SECRET` | Optional | Cloudflare Turnstile secret. If set, logged-**out** users can submit support after a captcha; if unset, only authenticated users can. |

### Must already be present (the hardening now depends on them)

| Var | Used by |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | All service-role RPCs (server-only) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Idempotent Stripe webhook (Task 6) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay verify now **fetches the order** to bind user + amount (Task 6) |
| `RESEND_API_KEY` | Support email |
| `GROQ_API_KEY` | Interview LLM + Whisper |

No longer needed (design choices for this batch): `UPSTASH_*` (rate limiting uses
Postgres), `STRIPE_PRICE_*` (checkout stays amount-based), `RAZORPAY_WEBHOOK_SECRET`
(verify validates via order fetch + HMAC signature).

---

## 3. Deploy & smoke-test

After the SQL and env vars are in place, deploy and verify:

1. **Free cap** — a free user can start `FREE_MONTHLY_INTERVIEWS` interviews, then the next `consume` returns "limit reached".
2. **No/forged token** — calling `/api/next-question` without a valid `x-interview-token` returns **403**.
3. **Support** — logged-out + no captcha → **401**; >5 submits/hour from one IP → **429**.
4. **Expired Pro** — set a row's `pro_until` to the past → that user is treated as **free** everywhere.
5. **Stripe replay** — re-deliver the same `checkout.session.completed` event → **no double-grant**, exactly one `payments` row.
6. **Razorpay mismatch** — a verify call whose order `notes.userId`/amount doesn't match → **400**.
