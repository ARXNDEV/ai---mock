import OpenAI from 'openai';

// Groq exposes an OpenAI-compatible API, so we reuse the `openai` SDK and just
// point it at Groq's base URL. One free key powers both the LLM and Whisper.
// Get a key at https://console.groq.com/keys
export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// Interview logic (question generation + evaluation). Swap here to change models.
export const GROQ_LLM_MODEL = 'llama-3.3-70b-versatile';

// Audio transcription. Alternative: 'whisper-large-v3-turbo' (faster, slightly less accurate).
export const GROQ_WHISPER_MODEL = 'whisper-large-v3';

export const INTERVIEWER_SYSTEM_PROMPT =
  'You are a strict but fair technical interviewer at a top tech company. ' +
  'Ask relevant questions and evaluate answers honestly.';

let client: OpenAI | null = null;

/** Lazily construct a singleton Groq client; throws if the key is missing. */
export function getGroq(): OpenAI {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set. Add it to .env.local.');
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: GROQ_BASE_URL });
  }
  return client;
}
