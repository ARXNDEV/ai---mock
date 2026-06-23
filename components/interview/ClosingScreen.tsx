'use client';

import { useEffect, useRef } from 'react';
import { PartyPopper } from 'lucide-react';
import { speak, cancelSpeech } from '@/lib/speech';

const MUTE_KEY = 'intervue:tts-muted';

export function ClosingScreen({ userName, onDone }: { userName: string; onDone: () => void }) {
  const spokenRef = useRef(false);
  const name = userName?.trim() || 'there';

  useEffect(() => {
    if (spokenRef.current) return;
    spokenRef.current = true;
    let muted = false;
    try {
      muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      /* ignore */
    }
    if (!muted) {
      speak(`That's a wrap, ${name}. Great work getting through that. Let's look at how you did.`);
    }
    return () => cancelSpeech();
  }, [name]);

  return (
    <div className="auth-card" style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
      <div
        style={{
          margin: '0 auto 18px',
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--ink)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <PartyPopper width={26} height={26} style={{ color: '#f0573b' }} />
      </div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        Interview complete
      </div>
      <h1 className="serif" style={{ fontSize: 30, lineHeight: 1.1, textTransform: 'capitalize' }}>
        That&apos;s a wrap, {name}! 🎉
      </h1>
      <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.6, marginTop: 12, maxWidth: 380, marginInline: 'auto' }}>
        Nice work getting through the full interview. I&apos;ve scored every answer — let&apos;s look at your breakdown.
      </p>
      <button
        type="button"
        className="btn btn-accent"
        style={{ width: '100%', marginTop: 20 }}
        onClick={() => {
          cancelSpeech();
          onDone();
        }}
      >
        See my results →
      </button>
    </div>
  );
}
