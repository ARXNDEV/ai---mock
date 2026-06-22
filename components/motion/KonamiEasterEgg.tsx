'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Trophy } from 'lucide-react';

const SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];
const STORAGE_KEY = 'intervue:godmode';

/**
 * Konami code (↑↑↓↓←→←→ B A) unlocks "Interview God Mode": a celebratory toast
 * plus a persistent achievement badge (remembered via localStorage). Listens on
 * window keydown and ignores typing inside inputs/textareas.
 */
export function KonamiEasterEgg() {
  const reduce = useReducedMotion();
  const [unlocked, setUnlocked] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Restore a previously-earned achievement (badge only, no toast).
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') setUnlocked(true);
    } catch {
      /* localStorage unavailable — ignore */
    }
  }, []);

  useEffect(() => {
    let index = 0;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const expected = SEQUENCE[index];
      if (key === expected) {
        index += 1;
        if (index === SEQUENCE.length) {
          index = 0;
          setUnlocked(true);
          setShowToast(true);
          try {
            localStorage.setItem(STORAGE_KEY, '1');
          } catch {
            /* ignore */
          }
        }
      } else {
        index = key === SEQUENCE[0] ? 1 : 0;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Auto-dismiss the toast.
  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 4200);
    return () => clearTimeout(t);
  }, [showToast]);

  const spring = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 280, damping: 22 };

  return (
    <>
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={spring}
            role="status"
            aria-live="polite"
            style={{
              position: 'fixed',
              left: '50%',
              bottom: 36,
              transform: 'translateX(-50%)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 22px',
              borderRadius: 999,
              background: 'var(--ink)',
              color: 'var(--paper)',
              boxShadow: '0 18px 50px -16px rgba(229, 64, 43, 0.55)',
              border: '1px solid rgba(240, 87, 59, 0.5)',
            }}
          >
            <Trophy width={18} height={18} style={{ color: '#F0573B' }} />
            <span className="serif" style={{ fontSize: 18 }}>
              Interview God Mode Activated
            </span>
            <span
              className="mono"
              style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F0573B' }}
            >
              +1 Achievement
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {unlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring}
            title="Achievement unlocked: Interview God Mode"
            aria-label="Achievement unlocked: Interview God Mode"
            style={{
              position: 'fixed',
              right: 20,
              bottom: 20,
              zIndex: 99,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 46,
              height: 46,
              borderRadius: 14,
              background: 'var(--accent-grad)',
              color: '#fff',
              boxShadow: '0 10px 26px -10px rgba(229, 64, 43, 0.7)',
              cursor: 'default',
            }}
          >
            <Trophy width={20} height={20} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
