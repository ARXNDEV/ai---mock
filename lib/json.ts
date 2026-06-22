/**
 * Robustly extract a JSON object from a model's text response.
 *
 * The model is instructed to return raw JSON, but we defensively handle:
 *  - Markdown code fences (```json ... ```)
 *  - Leading/trailing prose around the object
 */
export function extractJson<T>(text: string): T {
  const trimmed = text.trim();

  // Strip a fenced code block if present.
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenceMatch ? fenceMatch[1] : trimmed).trim();

  try {
    return JSON.parse(candidate) as T;
  } catch {
    // Fall back to the first balanced-looking { ... } slice.
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1)) as T;
    }
    throw new Error('Could not parse JSON from the model response.');
  }
}
