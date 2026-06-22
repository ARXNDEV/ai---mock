'use client';

import { useEffect } from 'react';

/**
 * Re-engagement tab title: when the user switches away from the tab, the
 * document title cycles through "come back" messages (and the favicon flips
 * to a sad face). Everything is restored the moment the tab regains focus.
 *
 * Mounted once in the root layout, so it applies across every route. The
 * current page title is captured at the moment the tab is hidden, so client
 * navigations keep restoring the right title.
 */
const MESSAGES = ['👀 Your interview is waiting…', '💔 We miss you! Come back', '🎯 Don’t ghost your prep'];
const SAD_FAVICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">😢</text></svg>',
  );

export default function TabRehook() {
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    let savedTitle = document.title;

    // Grab the current favicon href so we can restore it later.
    const iconEl = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    const savedIcon = iconEl?.getAttribute('href') ?? null;

    const setFavicon = (href: string | null) => {
      if (!iconEl || href === null) return;
      iconEl.setAttribute('href', href);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        savedTitle = document.title; // capture the real, current page title
        let i = 0;
        document.title = MESSAGES[0];
        setFavicon(SAD_FAVICON);
        timer = setInterval(() => {
          i = (i + 1) % MESSAGES.length;
          document.title = MESSAGES[i];
        }, 1200);
      } else {
        if (timer) clearInterval(timer);
        timer = undefined;
        document.title = savedTitle;
        setFavicon(savedIcon);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (timer) clearInterval(timer);
      document.title = savedTitle;
      setFavicon(savedIcon);
    };
  }, []);

  return null;
}
