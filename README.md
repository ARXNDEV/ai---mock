# Intervue.ai — AI Mock Interview SaaS

A production-style SaaS around an AI mock-interview engine. Users sign in, pick a
role + difficulty, answer **out loud**, and get instant AI-scored feedback. Free
users get 3 interviews/month; Pro unlocks unlimited interviews + full history.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase** — auth (Google OAuth + email magic link) + Postgres (`@supabase/ssr`)
- **Groq** (free tier, OpenAI-compatible) — `llama-3.3-70b-versatile` for interview
  logic + `whisper-large-v3` for transcription
- **Razorpay** (₹) and **Stripe** ($) — payments / Pro upgrades
- **Framer Motion** animations · **Radix UI** (dialog, dropdown) · **lucide-react** icons
- Glassmorphism dark theme, fully mobile responsive

## Setup

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.local.example .env.local   # fill in Supabase, Groq, Razorpay, Stripe

# 3. Create the database
#    Open the Supabase SQL editor and run the contents of supabase/schema.sql

# 4. Enable auth providers in Supabase:
#    Authentication → Providers → enable Google (set OAuth credentials)
#    Authentication → URL config → add http://localhost:3000/auth/callback as a redirect URL

# 5. Run
npm run dev          # http://localhost:3000
```

### Stripe webhook (local)

```bash
stripe listen --forward-to localhost:3000/api/payment/stripe/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET
```

## Routes

| Path | Access | Purpose |
| --- | --- | --- |
| `/` | public | Landing (hero, features, pricing, testimonials) |
| `/login`, `/signup` | public | Supabase auth (Google + magic link) |
| `/pricing` | public | Full pricing, ₹/$ toggle, Razorpay/Stripe checkout, FAQ |
| `/dashboard` | auth | Usage stats, recent sessions, upgrade banner |
| `/interview` | auth + credits | The mock-interview engine (credit-gated) |
| `/history` | auth (Pro) | All sessions, expandable feedback (locked for free) |

### API routes

| Path | Purpose |
| --- | --- |
| `POST /api/transcribe` | audio blob → Groq Whisper → `{ transcript }` (auth) |
| `POST /api/evaluate` | answer → Groq LLM → `{ score, good, missing, suggestion }` (auth) |
| `POST /api/next-question` | history → Groq LLM → `{ question }` (auth) |
| `POST /api/interview/consume` | consume 1 free credit (or pass for Pro); 403 at limit |
| `POST /api/sessions` | persist a completed interview |
| `POST /api/payment/razorpay/create-order` · `/verify` | Razorpay order + signature verify → upgrade |
| `POST /api/payment/stripe/create-checkout` · `/webhook` | Stripe checkout + webhook → upgrade |

## Architecture notes

- **Auth**: `middleware.ts` refreshes the Supabase session and protects
  `/dashboard`, `/interview`, `/history`. The `(app)` route group adds a shared
  nav + a second auth guard.
- **Credit gating** (decision: consumed **on interview start**): enforced in the
  `/interview` server gate **and** server-side in `POST /api/interview/consume`
  (returns 403 at the limit). Not in middleware — middleware shouldn't hit the DB
  on every request.
- **Security**: plan/usage are mutated **only** by the service-role client
  (`lib/supabase/admin.ts`, `server-only`). RLS lets users *read* their own
  profile and read/insert their own sessions, but never write plan or usage — so
  no one can grant themselves Pro from the client.
- **Currency** (decision: manual toggle, default ₹): the pricing page toggles
  ₹/$; ₹ → Razorpay, $ → Stripe.
- **Payments are one-time "upgrade to Pro" charges** (Stripe `mode: payment`,
  Razorpay order) since no recurring Price/Plan IDs were provided. To make them
  true subscriptions, create Stripe Prices / Razorpay Plans and switch to
  `mode: 'subscription'` / Razorpay Subscriptions, then handle renewal webhooks.
- **Sessions**: a completed 5-question interview is saved as one `sessions` row
  (`overall_score` + `questions` jsonb). The summary screen still renders even if
  the save fails.

## Database

`supabase/schema.sql` creates `profiles` and `sessions` with RLS and a trigger
that auto-creates a profile on signup. Run it once per project.

## Not built (out of scope)

Resume + JD analyzer (shown as "coming soon"), recurring-subscription billing,
team accounts.
