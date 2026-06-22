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
      ? `\nThe candidate's previous answer was:\n"""\n${lastAnswer.trim()}\n"""\nAsk a question that follows on naturally — probe deeper into something they raised (or skated over), or pivot to a related area to test their breadth. Make it feel like a real interviewer reacting to what they just said.`
      : '',
    `\nVary the question type across the interview — mix technical, behavioral, and situational questions.`,
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
    `\nRespond with ONLY a JSON object, no markdown and no extra text, in exactly this shape:`,
    `{"score": <integer 1-10>, "good": "<what the candidate did well>", "missing": "<what was missing or weak>", "suggestion": "<a concise stronger model answer>"}`,
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
