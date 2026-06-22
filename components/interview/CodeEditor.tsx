'use client';

import type { KeyboardEvent } from 'react';

/**
 * Lightweight code editor — a monospace textarea with tab-to-spaces and
 * auto-indent. Deliberately dependency-free (no Monaco/CodeMirror) so it's
 * reliable and light; good enough for interview-style snippets.
 */
export function CodeEditor({
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = `${value.slice(0, start)}  ${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 2;
    });
  }

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      readOnly={readOnly}
      spellCheck={false}
      placeholder={placeholder}
      style={{
        width: '100%',
        minHeight: 280,
        resize: 'vertical',
        fontFamily: 'var(--mono)',
        fontSize: 13,
        lineHeight: 1.65,
        tabSize: 2,
        whiteSpace: 'pre',
        overflowWrap: 'normal',
        overflowX: 'auto',
        color: 'var(--ink)',
        background: 'var(--card-2)',
        border: '1px solid var(--line-strong)',
        borderRadius: 'var(--r-sm)',
        padding: '14px 16px',
        outline: 'none',
      }}
    />
  );
}
