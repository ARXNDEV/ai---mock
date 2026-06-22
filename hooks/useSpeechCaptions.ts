'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Minimal typings for the Web Speech API (not in lib.dom by default).
interface SRAlternative {
  transcript: string;
}
interface SRResult {
  isFinal: boolean;
  0: SRAlternative;
}
interface SRResultList {
  length: number;
  [index: number]: SRResult;
}
interface SREvent {
  resultIndex: number;
  results: SRResultList;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SREvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/**
 * Live captions via the Web Speech API — interim + final text while the user
 * speaks. Purely a real-time preview; Whisper remains the source of truth for
 * the saved transcript. Degrades silently where unsupported (Firefox, etc.).
 */
export function useSpeechCaptions() {
  const [supported, setSupported] = useState(false);
  const [finalText, setFinalText] = useState('');
  const [interim, setInterim] = useState('');
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(Boolean(getRecognitionCtor()));
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    let acc = '';
    rec.onresult = (e: SREvent) => {
      let live = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const r = e.results[i];
        if (r.isFinal) acc += r[0].transcript;
        else live += r[0].transcript;
      }
      setFinalText(acc);
      setInterim(live);
    };
    rec.onerror = () => {};
    rec.onend = () => {};
    recRef.current = rec;
    setFinalText('');
    setInterim('');
    try {
      rec.start();
    } catch {
      /* start() throws if already running — ignore */
    }
  }, []);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const reset = useCallback(() => {
    setFinalText('');
    setInterim('');
  }, []);

  return { supported, text: `${finalText} ${interim}`.trim(), start, stop, reset };
}
