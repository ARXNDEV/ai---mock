'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { Magnetic } from '@/components/motion/Magnetic';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // `body { overflow-x: hidden }` can make <body> the scroll container rather
    // than the window, so read every candidate and listen in the capture phase
    // (scroll doesn't bubble) to catch whichever element actually scrolls.
    const getY = () =>
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const onScroll = () => setScrolled(getY() > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', onScroll, { capture: true });
  }, []);

  return (
    <header className={scrolled ? 'nav scrolled' : 'nav'}>
      <div className="nav-inner">
        <Logo href="/" />
        <div className={open ? 'nav-links open' : 'nav-links'}>
          <a href="#features" onClick={() => setOpen(false)}>
            Features
          </a>
          <a href="#pricing" onClick={() => setOpen(false)}>
            Pricing
          </a>
          <a href="#about" onClick={() => setOpen(false)}>
            About
          </a>
        </div>
        <div className="nav-right">
          <Link href="/login" className="btn btn-ghost btn-sm">
            Log in
          </Link>
          <Magnetic>
            <Link href="/signup" className="btn btn-ink">
              Start Free
            </Link>
          </Magnetic>
          <button className="hamburger" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            <svg className="ico" viewBox="0 0 24 24" width="20" height="20">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
