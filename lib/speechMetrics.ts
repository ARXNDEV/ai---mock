// Lightweight delivery analysis from a transcript + speaking time. Pure client
// computation — no API call. Gives the candidate concrete pace + filler feedback.

const FILLERS = [
  'um',
  'uh',
  'er',
  'ah',
  'like',
  'you know',
  'i mean',
  'basically',
  'actually',
  'literally',
  'sort of',
  'kind of',
];

export interface DeliveryMetrics {
  words: number;
  seconds: number;
  wpm: number;
  fillerCount: number;
  paceLabel: 'slow' | 'good' | 'fast';
  topFillers: { word: string; count: number }[];
}

export function analyzeDelivery(transcript: string, seconds: number): DeliveryMetrics {
  const clean = transcript.trim();
  const words = clean ? clean.split(/\s+/).length : 0;
  const safeSeconds = Math.max(1, Math.round(seconds));
  const wpm = Math.round((words / safeSeconds) * 60);

  const haystack = ` ${clean.toLowerCase().replace(/[.,!?;:"'’]/g, ' ')} `;
  const counts: Record<string, number> = {};
  let fillerCount = 0;
  for (const filler of FILLERS) {
    const re = new RegExp(`\\b${filler.replace(/ /g, '\\s+')}\\b`, 'g');
    const matches = haystack.match(re);
    if (matches) {
      counts[filler] = matches.length;
      fillerCount += matches.length;
    }
  }
  const topFillers = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word, count]) => ({ word, count }));

  const paceLabel: DeliveryMetrics['paceLabel'] = wpm < 110 ? 'slow' : wpm > 175 ? 'fast' : 'good';

  return { words, seconds: safeSeconds, wpm, fillerCount, paceLabel, topFillers };
}
