'use client';

import { useEffect, useRef } from 'react';

const BARS = 28;

/**
 * Real-time mic waveform. Feeds the recorder's MediaStream through a Web Audio
 * AnalyserNode and paints animated bars via requestAnimationFrame (transform
 * scaleY only — cheap). Falls back to a flat idle row when not recording.
 */
export function Waveform({ stream, active }: { stream: MediaStream | null; active: boolean }) {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!active || !stream) {
      // reset to idle heights
      barsRef.current.forEach((b) => b && (b.style.transform = 'scaleY(0.12)'));
      return;
    }

    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    let raf = 0;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const bars = barsRef.current;
      for (let i = 0; i < bars.length; i += 1) {
        const el = bars[i];
        if (!el) continue;
        // sample across the spectrum, bias toward voice range
        const v = data[Math.floor((i / bars.length) * data.length)] / 255;
        const scale = 0.12 + Math.min(1, v * 1.4) * 0.88;
        el.style.transform = `scaleY(${scale.toFixed(3)})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      source.disconnect();
      ctx.close().catch(() => {});
    };
  }, [stream, active]);

  return (
    <div
      aria-hidden="true"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 36 }}
    >
      {Array.from({ length: BARS }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
          style={{
            display: 'block',
            width: 3,
            height: 36,
            borderRadius: 3,
            transformOrigin: 'center',
            transform: 'scaleY(0.12)',
            transition: 'transform 0.08s linear',
            background: active ? 'var(--accent)' : 'var(--line-strong)',
          }}
        />
      ))}
    </div>
  );
}
