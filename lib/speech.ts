// Text-to-speech for the AI interviewer ("Aria"). Picks the warmest natural
// English voice available and tunes pitch/rate for a friendly, human delivery.

let cachedVoices: SpeechSynthesisVoice[] = [];

function refreshVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const v = window.speechSynthesis.getVoices();
  if (v.length) cachedVoices = v;
}

// Voices load asynchronously in most browsers — warm the cache now and on change.
if (typeof window !== 'undefined' && window.speechSynthesis) {
  refreshVoices();
  try {
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
  } catch {
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = cachedVoices.length ? cachedVoices : [];
  if (!voices.length) return undefined;

  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  const pool = english.length ? english : voices;

  // 1. Known warm, natural-sounding (mostly female) voices, in preference order.
  const preferred = [
    'Samantha',
    'Ava',
    'Aria',
    'Jenny',
    'Zoe',
    'Serena',
    'Allison',
    'Karen',
    'Moira',
    'Google UK English Female',
    'Google US English',
    'Microsoft Aria',
    'Microsoft Jenny',
  ];
  for (const name of preferred) {
    const v = pool.find((voice) => voice.name.includes(name));
    if (v) return v;
  }

  // 2. Any voice tagged natural / online / premium (these are the high-quality ones).
  const natural = pool.find((voice) => /natural|online|premium|enhanced/i.test(voice.name));
  if (natural) return natural;

  // 3. Any female-tagged voice, else the first English voice.
  const female = pool.find((voice) => /female|woman/i.test(voice.name));
  return female ?? pool[0];
}

export function cancelSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function speak(text: string, opts: { onStart?: () => void; onEnd?: () => void } = {}): void {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang || 'en-US';
  // Warmer, friendlier delivery: a touch slower and slightly higher-pitched.
  utterance.rate = 0.95;
  utterance.pitch = 1.08;
  utterance.volume = 1;
  if (opts.onStart) utterance.onstart = opts.onStart;
  if (opts.onEnd) {
    utterance.onend = opts.onEnd;
    utterance.onerror = opts.onEnd;
  }
  synth.speak(utterance);
}
