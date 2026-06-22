import type { Role, Difficulty } from './types';
import { ROLE_LABELS, DIFFICULTY_LABELS } from './constants';

/** Build the user prompt that asks Claude for the next, non-repeating question. */
export function buildQuestionPrompt(params: {
  role: Role;
  difficulty: Difficulty;
  jd: string;
  previousQuestions: string[];
  /** The candidate's most recent answer — lets the next question adapt to it. */
  lastAnswer?: string;
}): string {
  const { role, difficulty, jd, previousQuestions, lastAnswer } = params;

  const previous = previousQuestions.length
    ? previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')
    : '(none yet — this is the first question)';

  return [
    `Generate ONE interview question for a ${DIFFICULTY_LABELS[difficulty]} ${ROLE_LABELS[role]} candidate.`,
    jd.trim() ? `\nJob description for context:\n"""\n${jd.trim()}\n"""` : '',
    `\nQuestions already asked (do NOT repeat or closely paraphrase any of these):\n${previous}`,
    lastAnswer?.trim()
      ? `\nThe candidate just answered with:\n"""\n${lastAnswer.trim()}\n"""\nAsk this as a live FOLLOW-UP. Open by briefly reacting to a specific thing they actually said (quote or paraphrase it), then ask ONE focused question that digs into it — push for a concrete example, a trade-off they glossed over, an edge case, or the "why" behind a claim. It must read like a real interviewer reacting in the moment, not a generic next question. Occasionally (about 1 in 3) instead pivot to a fresh, related area so the interview still covers breadth.`
      : '',
    `\nAcross the interview, mix technical, behavioral, and situational questions.`,
    `Calibrate the difficulty to the ${DIFFICULTY_LABELS[difficulty]} level.`,
    `\nRespond with ONLY a JSON object, no markdown and no extra text, in exactly this shape:`,
    `{"question": "<the interview question as a single string>"}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Build the user prompt that asks Claude to evaluate a transcribed answer. */
export function buildEvaluationPrompt(params: {
  role: Role;
  jd: string;
  question: string;
  transcript: string;
}): string {
  const { role, jd, question, transcript } = params;

  return [
    `Evaluate the candidate's spoken answer to an interview question for a ${ROLE_LABELS[role]} role.`,
    jd.trim() ? `\nJob description for context:\n"""\n${jd.trim()}\n"""` : '',
    `\nQuestion:\n"""\n${question}\n"""`,
    `\nCandidate's answer (transcribed from audio — may contain minor transcription errors):\n"""\n${transcript}\n"""`,
    `\nScore the answer honestly from 1 to 10 (10 = outstanding). Be strict but fair, and account for the fact that this was spoken aloud.`,
    `\nAlso score these four dimensions 1-10 with a one-line note each:`,
    `- Content: relevance, correctness, and substance of what they said.`,
    `- Structure: organization and logical flow (e.g. STAR for behavioral).`,
    `- Communication: clarity, conciseness, and confidence.`,
    `- Depth: technical/role-specific depth, examples, and trade-offs.`,
    `The overall score should roughly reflect these four.`,
    `\nRespond with ONLY a JSON object, no markdown and no extra text, in exactly this shape:`,
    `{"score": <integer 1-10>, "rubric": [{"dimension": "Content", "score": <1-10>, "note": "<short>"}, {"dimension": "Structure", "score": <1-10>, "note": "<short>"}, {"dimension": "Communication", "score": <1-10>, "note": "<short>"}, {"dimension": "Depth", "score": <1-10>, "note": "<short>"}], "good": "<what the candidate did well>", "missing": "<what was missing or weak>", "suggestion": "<a concise stronger model answer>"}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Build the prompt that analyzes a resume against a target job description. */
export function buildResumePrompt(params: { resume: string; jd: string }): string {
  const { resume, jd } = params;

  return [
    `Analyze how well the candidate's resume matches the target job, as an expert technical recruiter would. Be specific and reference the actual content.`,
    `\nResume:\n"""\n${resume.trim()}\n"""`,
    jd.trim()
      ? `\nTarget job description:\n"""\n${jd.trim()}\n"""`
      : `\n(No job description provided — assess the resume's general strength for the candidate's apparent target role.)`,
    `\nReturn ONLY a JSON object, no markdown and no extra text, in exactly this shape:`,
    `{"matchScore": <integer 0-100>, "summary": "<2-sentence overall assessment>", "strengths": ["<specific strength>", ...], "gaps": ["<missing skill or weakness vs the JD>", ...], "suggestions": ["<concrete, prioritized fix>", ...]}`,
    `Give 3 to 5 items in each array, ordered by importance.`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Build the prompt that rewrites a résumé into the strongest, ATS-optimized
 * version tailored to a target job. Hard rule: reframe only real experience —
 * never invent roles, employers, dates, degrees, or fake metrics.
 */
export function buildTailoredResumePrompt(params: { resume: string; jd: string }): string {
  const { resume, jd } = params;

  return [
    `You are a world-class résumé writer and ATS optimization expert. Rewrite the candidate's résumé into the strongest possible version tailored to the target job.`,
    `\nCandidate's current résumé:\n"""\n${resume.trim()}\n"""`,
    jd.trim()
      ? `\nTarget job description:\n"""\n${jd.trim()}\n"""`
      : `\n(No job description provided — optimize for the candidate's apparent target role.)`,
    `\nRules — follow ALL of them:`,
    `1. INTEGRITY: Only reframe experience, skills, and achievements that are actually present or clearly implied in the résumé. NEVER invent employers, job titles, dates, degrees, certifications, or fabricated numbers. If the original lacks a metric, keep the bullet qualitative — do not make up statistics.`,
    `2. Rewrite each experience bullet to lead with a strong action verb and surface impact/outcome; preserve any real numbers and keep them accurate.`,
    `3. Mirror the job description's terminology and hard skills wherever the candidate genuinely has them, so it passes ATS keyword screening.`,
    `4. Write a sharp 2-3 sentence professional summary targeted at this exact role.`,
    `5. Keep it concise, professional, and ATS-safe (plain text, no tables/graphics).`,
    `\nReturn ONLY a JSON object, no markdown and no extra text, in exactly this shape:`,
    `{"name": "<candidate name if present, else empty>", "headline": "<target role title line>", "summary": "<2-3 sentence tailored summary>", "skills": ["<skill>", ...], "experience": [{"title": "<role>", "org": "<employer>", "period": "<dates if known, else empty>", "bullets": ["<impact bullet>", ...]}], "education": ["<degree, institution, year if known>", ...], "atsKeywords": ["<JD keyword the résumé now covers>", ...], "changes": ["<key improvement you made>", ...]}`,
    `Provide 6-12 skills, 3-6 bullets per role, and 3-6 items in atsKeywords and changes.`,
  ]
    .filter(Boolean)
    .join('\n');
}
