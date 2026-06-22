'use client';

import { useEffect } from 'react';

/**
 * Animated tab branding:
 *  - The favicon flips between the two brand marks (arrow ↔ book) every second
 *    AT ALL TIMES — whether or not the tab is focused.
 *  - When the tab loses focus, the title ALSO cycles through "come back"
 *    messages; the real page title is restored the moment the tab is active.
 *
 * Mounted once in the root layout, so it applies across every route.
 */
const MESSAGES = ['👀 Your interview is waiting…', '💔 We miss you! Come back', '🎯 Don’t ghost your prep'];
const AWAY_FAVICON = '/favicon-book.png'; // book mark, alternated against the default arrow
const TICK_MS = 1000; // flip once per second

export default function TabRehook() {
  useEffect(() => {
    let savedTitle = document.title;

    const iconEl = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    const savedIcon = iconEl?.getAttribute('href') ?? null;
    // Frames the favicon cycles through: the page's own icon (arrow), then the book.
    const icons = savedIcon ? [savedIcon, AWAY_FAVICON] : [AWAY_FAVICON];

    const setFavicon = (href: string | null) => {
      if (!iconEl || href === null) return;
      iconEl.setAttribute('href', href);
    };

    let i = 0;
    const tick = () => {
      setFavicon(icons[i % icons.length]); // favicon always animates
      if (document.hidden) {
        document.title = MESSAGES[i % MESSAGES.length]; // title only changes while away
      }
      i += 1;
    };

    const onVisibility = () => {
      if (document.hidden) {
        savedTitle = document.title; // capture the real, current page title
      } else {
        document.title = savedTitle; // restore title; favicon keeps animating
      }
    };

    tick(); // apply immediately, then flip every second
    const timer = setInterval(tick, TICK_MS);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      document.title = savedTitle;
      setFavicon(savedIcon);
    };
  }, []);

  return null;
}
