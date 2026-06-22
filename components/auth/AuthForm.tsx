'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { REFERRAL_STORAGE_KEY } from '@/lib/referral';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const searchParams = useSearchParams();
  const next = searchParams.get('redirectedFrom') || '/dashboard';

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'google' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Carry an inbound ?ref code through the auth round-trip (claimed post-login).
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      try {
        localStorage.setItem(REFERRAL_STORAGE_KEY, ref.trim());
      } catch {
        /* ignore */
      }
    }
  }, [searchParams]);

  function callbackUrl() {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
  }

  async function handleGoogle() {
    setError(null);
    setStatus('google');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setError(error.message);
      setStatus('idle');
    }
  }

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setStatus('sending');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl() },
    });
    if (error) {
      setError(error.message);
      setStatus('idle');
    } else {
      setStatus('sent');
    }
  }

  if (status === 'sent') {
    return (
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <CheckCircle2 width={44} height={44} style={{ color: 'var(--green)' }} />
        <h2 className="serif" style={{ fontSize: 22 }}>
          Check your inbox
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
          We sent a magic sign-in link to <span style={{ color: 'var(--ink)' }}>{email}</span>.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mono"
          style={{ marginTop: 6, fontSize: 12, color: 'var(--accent)', background: 'none' }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <button type="button" className="btn btn-line" style={{ width: '100%' }} onClick={handleGoogle} disabled={status === 'google'}>
        {status === 'google' ? <Loader2 width={18} height={18} className="animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </button>

      <div
        className="mono"
        style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--ink-mute)', fontSize: 11 }}
      >
        <span style={{ height: 1, flex: 1, background: 'var(--line)' }} /> OR
        <span style={{ height: 1, flex: 1, background: 'var(--line)' }} />
      </div>

      <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <Mail
            width={16}
            height={16}
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-mute)', pointerEvents: 'none' }}
          />
          <input
            type="email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <button type="submit" className="btn btn-accent" style={{ width: '100%' }} disabled={status === 'sending'}>
          {status === 'sending' ? <Loader2 width={18} height={18} className="animate-spin" /> : <Mail width={18} height={18} />}
          {mode === 'signup' ? 'Sign up with email' : 'Send magic link'}
        </button>
      </form>

      {error && (
        <p className="mono" style={{ color: 'var(--accent)', fontSize: 13, textAlign: 'center' }}>
          {error}
        </p>
      )}
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-mute)' }}>
        We&apos;ll email you a secure sign-in link — no password needed.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" transform="scale(.5)" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" transform="scale(.5)" />
      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.3c-2 1.5-4.6 2.4-7.4 2.4-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.6 39.6 16.2 44 24 44z" transform="scale(.5)" />
      <path fill="#1976D2" d="M43.6 20.5H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.3 5.3C41.4 36.3 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z" transform="scale(.5)" />
    </svg>
  );
}
