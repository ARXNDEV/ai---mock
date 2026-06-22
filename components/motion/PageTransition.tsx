'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Crossfades page content on route change. Keyed by pathname so the CSS
 * entrance replays each navigation. Opacity-only (no transform) so it never
 * becomes a containing block for the fixed cursor/confetti overlays.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
