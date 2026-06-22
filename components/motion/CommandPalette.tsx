'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface Command {
  label: string;
  hint: string;
  href: string;
  keywords: string;
}

const COMMANDS: Command[] = [
  { label: 'Start New Interview', hint: 'Interview', href: '/interview', keywords: 'start practice mock new begin' },
  { label: 'Dashboard', hint: 'Home', href: '/dashboard', keywords: 'home overview metrics stats' },
  { label: 'Practice History', hint: 'History', href: '/history', keywords: 'sessions past scores results' },
  { label: 'Pricing & Plans', hint: 'Pricing', href: '/pricing', keywords: 'upgrade pro price plans billing' },
  { label: 'Landing Page', hint: 'Home', href: '/', keywords: 'home marketing landing' },
  { label: 'Log in', hint: 'Account', href: '/login', keywords: 'sign in login account' },
  { label: 'Create account', hint: 'Account', href: '/signup', keywords: 'sign up register join free' },
];

/**
 * Global ⌘K / Ctrl+K command palette. Keyboard-first: arrows to move, Enter to
 * open, Esc to dismiss. Rendered with CSS entrance animations (no dependency on
 * JS animation libs, so it can never get stuck hidden).
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((c) => `${c.label} ${c.keywords}`.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        haptic(8);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function run(cmd: Command) {
    setOpen(false);
    haptic(12);
    router.push(cmd.href);
  }

  function onInputKey(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = results[active];
      if (cmd) run(cmd);
    }
  }

  if (!open) return null;

  return (
    <div
      className="cmdk-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="cmdk-panel">
        <div className="cmdk-input-row">
          <Search width={18} height={18} style={{ color: 'var(--ink-mute)', flex: 'none' }} />
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="Search commands…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            aria-label="Search commands"
          />
          <kbd className="cmdk-kbd">ESC</kbd>
        </div>
        <div className="cmdk-list">
          {results.length === 0 ? (
            <div className="cmdk-empty">No matching commands</div>
          ) : (
            results.map((cmd, i) => (
              <button
                key={`${cmd.href}-${cmd.label}`}
                className={i === active ? 'cmdk-item active' : 'cmdk-item'}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(cmd)}
              >
                <span className="cmdk-item-label">{cmd.label}</span>
                <span className="cmdk-item-hint">{cmd.hint}</span>
                <ArrowRight width={15} height={15} className="cmdk-item-arrow" />
              </button>
            ))
          )}
        </div>
        <div className="cmdk-foot">
          <span>
            <kbd className="cmdk-kbd">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="cmdk-kbd">↵</kbd> open
          </span>
          <span className="mono">⌘K</span>
        </div>
      </div>
    </div>
  );
}
