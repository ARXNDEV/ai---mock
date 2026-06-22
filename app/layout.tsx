import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Instrument_Serif, Hanken_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';
import TabRehook from '@/components/TabRehook';
import { CommandPalette } from '@/components/motion/CommandPalette';
import { PageTransition } from '@/components/motion/PageTransition';
import { PWARegister } from '@/components/motion/PWARegister';

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});
const sans = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});
const mono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Intervue.ai — Ace your next interview with AI',
  description:
    'Practice with an intelligent AI interviewer, get instant feedback, and land your dream job with confidence.',
  icons: { icon: '/favicon.png', apple: '/favicon.png' },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Intervue.ai', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#E5402B',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <div className="aurora" aria-hidden="true">
          <span className="blob b1" />
          <span className="blob b2" />
          <span className="blob b3" />
        </div>
        <PageTransition>{children}</PageTransition>
        <CommandPalette />
        <TabRehook />
        <PWARegister />
      </body>
    </html>
  );
}
