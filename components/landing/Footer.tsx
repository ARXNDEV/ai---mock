import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export function Footer() {
  return (
    <footer className="footer" id="about">
      <div className="footer-inner">
        <div>
          <Logo href="/" />
          <p className="tagline">Your AI interview coach. Practice smarter, get hired faster.</p>
        </div>
        <div className="footer-col">
          <h4>Product</h4>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <Link href="/pricing">Plans</Link>
        </div>
        <div className="footer-col">
          <h4>Legal</h4>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/security">Security</Link>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <a href="#about">About</a>
          <a href="#">Blog</a>
          <Link href="/support">Contact</Link>
        </div>
      </div>
      <div className="copyright">
        <span>© 2026 Intervue.ai</span>
        <span>Made for the bold</span>
      </div>
    </footer>
  );
}
