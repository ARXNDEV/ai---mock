'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
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
          <Link href="/signup" className="btn btn-ink">
            Start Free
          </Link>
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
