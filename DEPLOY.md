# Deploying Intervue.ai

This app is a Next.js 14 app. The recommended host is **Vercel** (free tier,
auto-deploys from GitHub). Follow the steps in order — the order matters because
you need the live domain before you can finish the Supabase and Stripe setup.

The repo is already on GitHub: `https://github.com/ARXNDEV/ai---mock`

---

## What works with vs. without keys

| Without any keys | With Supabase + Groq | With payments too |
| --- | --- | --- |
| Landing + Pricing pages render | Auth, dashboard, interviews, history all work | Pro upgrades (₹ Razorpay / $ Stripe) work |

**Minimum to have a working product:** Supabase (3 vars) + Groq (1 var).
Payments are only needed for paid upgrades.

> ⚠️ The `NEXT_PUBLIC_*` variables are inlined into the browser bundle **at build
> time** — they must be set in Vercel *before* the build, and changing them
> requires a redeploy.

---

## Step 1 — Supabase (database + auth)

1. Create a project at https://supabase.com (free tier is fine).
2. **Run the schema:** open the project's **SQL Editor**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the
   `profiles` and `sessions` tables, RLS policies, and the signup trigger.
3. **Enable Google sign-in** (for the "Continue with Google" button):
   Authentication → Providers → Google → enable, and paste a Google OAuth client
   ID + secret (from Google Cloud Console → Credentials → OAuth client → Web).
   - Magic-link (email) sign-in works without Google, but Supabase's built-in
     email is rate-limited — configure SMTP under Authentication → Emails for
     real volume.
4. **Grab your keys:** Settings → API:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` / public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**secret** — server only)

(Leave the redirect-URL config for Step 4, once you have the live domain.)

## Step 2 — Groq (interview LLM + transcription)

Create a free key at https://console.groq.com/keys → `GROQ_API_KEY`.

## Step 3 — Payments (optional, for Pro upgrades)

- **Razorpay** (₹): Dashboard → Settings → API Keys → generate.
  - Key ID → `RAZORPAY_KEY_ID` **and** `NEXT_PUBLIC_RAZORPAY_KEY_ID` (same value)
  - Key Secret → `RAZORPAY_KEY_SECRET`
- **Stripe** ($): Dashboard → Developers → API keys.
  - Secret key → `STRIPE_SECRET_KEY`
  - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (set it; currently
    unused since checkout is hosted-redirect)
  - `STRIPE_WEBHOOK_SECRET` comes in Step 4.

## Step 4 — Deploy to Vercel

1. Go to https://vercel.com → **Add New → Project** → import
   `ARXNDEV/ai---mock` from GitHub. (Framework preset, build command, and Node
   version are auto-detected — no changes needed.)
2. Under **Environment Variables**, add every key from Steps 1–3 (see the table
   below). For a first deploy you can add just the Supabase + Groq ones.
3. Click **Deploy**. You'll get a URL like `https://<your-app>.vercel.app`.

## Step 5 — Finish auth + payments config (needs the live domain)

1. **Supabase redirect URLs:** Authentication → URL Configuration:
   - **Site URL:** `https://<your-domain>`
   - **Redirect URLs:** add `https://<your-domain>/auth/callback`
     (keep `http://localhost:3000/auth/callback` for local dev too).
2. **Google OAuth:** in Google Cloud Console, add
   `https://<your-project-ref>.supabase.co/auth/v1/callback` to the OAuth
   client's Authorized redirect URIs (Supabase shows the exact URL on the
   provider page).
3. **Stripe webhook** (only if using Stripe): Dashboard → Developers → Webhooks
   → Add endpoint → `https://<your-domain>/api/payment/stripe/webhook`, event
   `checkout.session.completed`. Copy the signing secret (`whsec_…`) into the
   Vercel env var `STRIPE_WEBHOOK_SECRET`, then **redeploy**.

## Step 6 — Verify

- Visit the domain → landing + pricing render.
- Sign up (magic link or Google) → you should land on `/dashboard`.
- Start an interview → record an answer → you should get a transcript + score.
- (If payments configured) Upgrade → complete a test payment → plan flips to Pro.

---

## Environment variable reference

| Variable | Where to get it | Required for |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | auth, all app pages |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | auth, all app pages |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (secret) | credit gating, plan upgrades |
| `GROQ_API_KEY` | console.groq.com/keys | questions, transcription, scoring |
| `RAZORPAY_KEY_ID` | Razorpay → API Keys | ₹ checkout |
| `RAZORPAY_KEY_SECRET` | Razorpay → API Keys (secret) | ₹ checkout verify |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | same as `RAZORPAY_KEY_ID` | ₹ checkout (browser) |
| `STRIPE_SECRET_KEY` | Stripe → API keys (secret) | $ checkout |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks (Step 5) | $ upgrade fulfillment |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → API keys | (reserved; unused) |

## Custom domain (optional)

Vercel → Project → Settings → Domains → add your domain and follow the DNS
instructions. Then update the Supabase Site URL / redirect URLs and the Stripe
webhook endpoint to the custom domain.

## Notes

- Every push to `main` triggers an automatic Vercel deploy.
- Secrets live only in Vercel's env settings — never commit them. `.env.local`
  is gitignored.
- Auto-deploys build with the env vars configured at build time; if you add or
  change a `NEXT_PUBLIC_*` var, trigger a redeploy.
