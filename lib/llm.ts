import 'server-only';
import { getGroq, GROQ_LLM_MODEL, INTERVIEWER_SYSTEM_PROMPT } from '@/lib/groq';
import { extractJson } from '@/lib/json';

const STRICT_SUFFIX =
  '\n\nIMPORTANT: Reply with a single valid JSON object only — no prose, no markdown, no code fences.';

/**
 * Run a chat completion and parse its JSON response. If the model returns
 * unparseable text, retry ONCE with a stricter "JSON only" reprompt. Returns
 * null if it still fails to parse, so callers can fall back to a safe default
 * instead of 500-ing. A thrown API/network error on the first attempt
 * propagates, so genuine outages still surface as errors rather than masquerade
 * as a parse failure.
 */
export async function completeJson<T>(
  prompt: string,
  opts?: { maxTokens?: number; system?: string },
): Promise<T | null> {
  const system = opts?.system ?? INTERVIEWER_SYSTEM_PROMPT;
  const maxTokens = opts?.maxTokens ?? 1024;

  const run = async (userPrompt: string): Promise<string> => {
    const completion = await getGroq().chat.completions.create({
      model: GROQ_LLM_MODEL,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
    });
    return completion.choices[0]?.message?.content ?? '';
  };

  const first = await run(prompt);
  try {
    return extractJson<T>(first);
  } catch {
    try {
      return extractJson<T>(await run(prompt + STRICT_SUFFIX));
    } catch (err) {
      console.error('[llm] unparseable model JSON after strict retry:', err);
      return null;
    }
  }
}
