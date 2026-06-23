'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Send, Loader2, LifeBuoy } from 'lucide-react';

interface Msg {
  role: 'support' | 'user';
  text: string;
}

// Minimal typing for the Cloudflare Turnstile global.
interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      theme?: 'auto' | 'light' | 'dark';
    },
  ) => string;
  reset: (widgetId?: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const GREETING =
  "Hi! 👋 I'm Intervue Support. Tell me what's going on — a question, a bug, billing, anything. Drop your email and message and I'll open a ticket; we reply by email.";

export function SupportChat({ authed = false }: { authed?: boolean }) {
  const [thread, setThread] = useState<Msg[]>([{ role: 'support', text: GREETING }]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [token, setToken] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Logged-out visitors must solve a Turnstile captcha to submit a ticket.
  const needsCaptcha = !authed && !!SITE_KEY;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  // Render the Turnstile widget once its script is loaded (poll until ready).
  useEffect(() => {
    if (!needsCaptcha) return;
    let cancelled = false;
    const tryRender = () => {
      if (cancelled || widgetIdRef.current) return;
      const ts = window.turnstile;
      if (ts && widgetRef.current && SITE_KEY) {
        widgetIdRef.current = ts.render(widgetRef.current, {
          sitekey: SITE_KEY,
          callback: (t) => setToken(t),
          'expired-callback': () => setToken(''),
          'error-callback': () => setToken(''),
          theme: 'auto',
        });
      } else {
        setTimeout(tryRender, 300);
      }
    };
    tryRender();
    return () => {
      cancelled = true;
    };
  }, [needsCaptcha]);

  function resetCaptcha() {
    setToken('');
    if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
  }

  async function send() {
    const e = email.trim();
    const m = message.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setThread((t) => [...t, { role: 'support', text: 'Please enter a valid email so I can reply to you. 🙂' }]);
      return;
    }
    if (m.length < 5) {
      setThread((t) => [...t, { role: 'support', text: 'Could you add a little more detail about the issue?' }]);
      return;
    }
    if (needsCaptcha && !token) {
      setThread((t) => [...t, { role: 'support', text: 'Please complete the “I’m human” check just below, then send. 🤖' }]);
      return;
    }
    setThread((t) => [...t, { role: 'user', text: m }]);
    setMessage('');
    setSending(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, message: m, turnstileToken: token || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      // Turnstile tokens are single-use — reset the widget for the next message.
      resetCaptcha();
      if (res.ok && data.ticketId) {
        setThread((t) => [
          ...t,
          {
            role: 'support',
            text: `Got it — ticket ${data.ticketId} created. ✅ We'll reply to ${e} as soon as we can. Anything else?`,
          },
        ]);
      } else {
        const fallback = data.fallback || 'iarunrao01@gmail.com';
        setThread((t) => [
          ...t,
          {
            role: 'support',
            text: `Hmm, I couldn't submit that just now. You can email us directly at ${fallback} and we'll get right on it.`,
          },
        ]);
      }
    } catch {
      setThread((t) => [
        ...t,
        { role: 'support', text: "Network hiccup — please email us at iarunrao01@gmail.com and we'll help." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="auth-card" style={{ width: '100%', maxWidth: 560, padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: 11, background: 'var(--accent-grad)', color: '#fff', flex: 'none' }}>
          <LifeBuoy width={20} height={20} className="ico" />
        </span>
        <div>
          <div className="serif" style={{ fontSize: 19, lineHeight: 1 }}>
            Intervue Support
          </div>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--green)', marginTop: 4 }}>
            ● Usually replies within a day
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360, overflowY: 'auto' }}>
        {thread.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '82%',
              padding: '11px 15px',
              borderRadius: 14,
              fontSize: 14.5,
              lineHeight: 1.5,
              background: m.role === 'user' ? 'var(--accent)' : 'var(--card-2)',
              color: m.role === 'user' ? '#fff' : 'var(--ink)',
              border: m.role === 'user' ? 'none' : '1px solid var(--line)',
            }}
          >
            {m.text}
          </div>
        ))}
        {sending && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--ink-mute)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader2 width={14} height={14} className="animate-spin" /> opening your ticket…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: '16px 22px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {needsCaptcha && (
          <>
            <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
            <div ref={widgetRef} style={{ minHeight: 65 }} />
          </>
        )}
        <input
          type="email"
          className="field"
          style={{ paddingLeft: 14 }}
          placeholder="your@email.com"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          autoComplete="email"
        />
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            placeholder="Describe your issue…"
            value={message}
            onChange={(ev) => setMessage(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter' && !ev.shiftKey) {
                ev.preventDefault();
                if (!sending) send();
              }
            }}
            rows={2}
            style={{
              flex: 1,
              border: '1px solid var(--line-strong)',
              background: 'var(--card)',
              borderRadius: 'var(--r-sm)',
              padding: '11px 14px',
              fontFamily: 'var(--sans)',
              fontSize: 14,
              lineHeight: 1.5,
              color: 'var(--ink)',
              outline: 'none',
              resize: 'none',
            }}
          />
          <button
            type="button"
            className="btn btn-accent"
            onClick={send}
            disabled={sending}
            aria-label="Send"
            style={{ flex: 'none', padding: '13px 16px' }}
          >
            {sending ? <Loader2 width={18} height={18} className="animate-spin" /> : <Send width={18} height={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
