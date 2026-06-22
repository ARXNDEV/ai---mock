# AI Mock Interview (Phase 1 MVP)

A web app that runs a 5-question mock technical interview. An AI interviewer
asks role-tailored questions, you answer by **speaking**, your audio is
transcribed, and the model grades each answer with structured feedback. At the
end you get a session summary.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Groq API** (free tier) — one key powers both:
  - `llama-3.3-70b-versatile` — question generation + answer evaluation
  - `whisper-large-v3` — audio transcription
- **MediaRecorder** (browser) for recording, **SpeechSynthesis** (browser) for optional TTS

> Groq exposes an OpenAI-compatible API, so the app uses the `openai` SDK pointed
> at Groq's base URL (see `lib/groq.ts`). To switch providers or models, change
> the constants in that one file.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Add your free Groq API key
cp .env.local.example .env.local
#   then edit .env.local and set:
#   GROQ_API_KEY=...        (get one free at https://console.groq.com/keys)

# 3. Run the dev server
npm run dev
```

Open http://localhost:3000. The browser will ask for microphone permission the
first time you record. (Mic access requires `localhost` or HTTPS.)

## Project structure

```
app/
  layout.tsx              Root layout + global styles
  page.tsx                Orchestrator — holds all session state (useState)
  globals.css             Tailwind entrypoint
  api/
    transcribe/route.ts   POST audio blob  → Groq Whisper → { transcript }
    evaluate/route.ts     POST answer      → Groq LLM → { score, good, missing, suggestion }
    next-question/route.ts POST history    → Groq LLM → { question }
components/
  SetupScreen.tsx         Role / difficulty / JD + Start
  InterviewScreen.tsx     Question + TTS, record → transcribe → review → evaluate
  FeedbackPanel.tsx       Score, good, missing, collapsible suggestion, Next
  SummaryScreen.tsx       Overall score, strengths, tips, per-question breakdown
hooks/
  useRecorder.ts          MediaRecorder wrapper
lib/
  types.ts                Shared types (client + server safe)
  constants.ts            Roles, difficulties, MAX_QUESTIONS
  groq.ts                 Groq (OpenAI-compatible) client, model ids, system prompt
  prompts.ts              Prompt builders for question + evaluation
  json.ts                 Robust JSON extraction from model output
  api.ts                  Client-side fetch wrappers
```

## API routes

| Route                | Method | Request                                         | Response                                      |
| -------------------- | ------ | ----------------------------------------------- | --------------------------------------------- |
| `/api/transcribe`    | POST   | `multipart/form-data` with `audio` blob         | `{ transcript }`                              |
| `/api/evaluate`      | POST   | `{ question, transcript, role, jd }`            | `{ score, good, missing, suggestion }`        |
| `/api/next-question` | POST   | `{ role, difficulty, jd, previousQuestions[] }` | `{ question }`                                |

## Notes & implementation decisions

- **Provider:** Groq's free tier. Because it's OpenAI-API-compatible, both the LLM
  (chat completions) and transcription use the `openai` SDK with a base-URL swap.
  All model/provider config lives in `lib/groq.ts`.
- **Structured JSON:** the LLM routes use Groq's JSON mode
  (`response_format: { type: 'json_object' }`) and the server still parses
  defensively (`lib/json.ts`) as a fallback.
- **Free-tier caveats:** Groq rate-limits the free tier; under heavy use you may
  see `429` errors surfaced in the UI. The interviewer system prompt is the one
  from the spec.
- **Session summary** is computed client-side from the per-answer feedback (no DB,
  no extra API route). To make it LLM-synthesized, add a `/api/summary` route.
- **State** lives entirely in React `useState` in `app/page.tsx`. No persistence.
- **Audio format** is chosen from what the browser's MediaRecorder supports
  (WebM/Opus on Chromium, MP4 on Safari); Whisper accepts both.

## Swapping providers

Everything provider-specific is in `lib/groq.ts`. To use a different
OpenAI-compatible provider, change `GROQ_BASE_URL`, the model constants, and the
env var name. The prompts (`lib/prompts.ts`) are provider-agnostic.

## Not built yet (per spec)

Auth / login, payments, database persistence, user accounts.
