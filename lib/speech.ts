// Text-to-speech helper for the AI interviewer's spoken questions.
// Wraps the browser SpeechSynthesis API with a sensible English voice pick.

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;
  // Prefer natural-sounding English voices where available.
  const preferred = [
    'Samantha',
    'Google US English',
    'Microsoft Aria',
    'Microsoft Jenny',
    'Karen',
    'Moira',
    'Daniel',
  ];
  for (const name of preferred) {
    const v = voices.find((voice) => voice.name.includes(name));
    if (v) return v;
  }
  return voices.find((voice) => voice.lang?.toLowerCase().startsWith('en')) ?? voices[0];
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
  utterance.rate = 1;
  utterance.pitch = 1;
  if (opts.onStart) utterance.onstart = opts.onStart;
  if (opts.onEnd) {
    utterance.onend = opts.onEnd;
    utterance.onerror = opts.onEnd;
  }
  synth.speak(utterance);
}
