import type { Role, Difficulty } from './types';
import { ROLE_LABELS, DIFFICULTY_LABELS } from './constants';

/** Build the user prompt that asks Claude for the next, non-repeating question. */
export function buildQuestionPrompt(params: {
  role: Role;
  difficulty: Difficulty;
  jd: string;
  previousQuestions: string[];
}): string {
  const { role, difficulty, jd, previousQuestions } = params;

  const previous = previousQuestions.length
    ? previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')
    : '(none yet — this is the first question)';

  return [
    `Generate ONE interview question for a ${DIFFICULTY_LABELS[difficulty]} ${ROLE_LABELS[role]} candidate.`,
    jd.trim() ? `\nJob description for context:\n"""\n${jd.trim()}\n"""` : '',
    `\nQuestions already asked (do NOT repeat or closely paraphrase any of these):\n${previous}`,
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
