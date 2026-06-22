'use client';

import { useEffect } from 'react';

/**
 * Re-engagement tab: when the user switches away from the tab, the title AND
 * the favicon flip every second to grab attention — the title cycles through
 * "come back" messages while the favicon alternates between the two brand
 * marks. Everything is restored the moment the tab regains focus.
 *
 * Mounted once in the root layout, so it applies across every route. The
 * current page title is captured at the moment the tab is hidden, so client
 * navigations keep restoring the right title.
 */
const MESSAGES = ['👀 Your interview is waiting…', '💔 We miss you! Come back', '🎯 Don’t ghost your prep'];
const AWAY_FAVICON = '/favicon-book.png'; // book mark, alternated against the default arrow
const TICK_MS = 1000; // flip once per second

export default function TabRehook() {
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    let savedTitle = document.title;

    // Grab the current favicon href so we can alternate against it / restore it.
    const iconEl = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    const savedIcon = iconEl?.getAttribute('href') ?? null;

    const setFavicon = (href: string | null) => {
      if (!iconEl || href === null) return;
      iconEl.setAttribute('href', href);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        savedTitle = document.title; // capture the real, current page title
        // Alternate favicon between the book mark and whatever the page's icon was.
        const icons = savedIcon ? [AWAY_FAVICON, savedIcon] : [AWAY_FAVICON];
        let i = 0;
        const tick = () => {
          document.title = MESSAGES[i % MESSAGES.length];
          setFavicon(icons[i % icons.length]);
          i += 1;
        };
        tick(); // apply immediately, then flip every second
        timer = setInterval(tick, TICK_MS);
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
