// Tiny haptics helper — a no-op anywhere `navigator.vibrate` isn't supported
// (most desktops, iOS Safari). Patterns are in milliseconds.
export function haptic(pattern: number | number[] = 10): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}
