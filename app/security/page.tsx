import type { Metadata } from 'next';
import { LegalShell } from '@/components/legal/LegalShell';

export const metadata: Metadata = {
  title: 'Security — Intervue.ai',
  description: 'How Intervue.ai protects your account and data.',
};

export default function SecurityPage() {
  return (
    <LegalShell
      title="Security"
      updated="June 22, 2026"
      intro="We take the security of your account and practice data seriously. Here's an overview of how Intervue.ai is built to protect it."
    >
      <h2>Encryption</h2>
      <p>
        All traffic is served over HTTPS/TLS, so data is encrypted in transit between your device and our servers. Data
        at rest is stored on managed, encrypted infrastructure.
      </p>

      <h2>Authentication</h2>
      <ul>
        <li>Sign-in is handled by Supabase Auth using Google OAuth and passwordless magic links — we never store passwords.</li>
        <li>Sessions use secure, http-only cookies and are refreshed automatically.</li>
      </ul>

      <h2>Data isolation</h2>
      <p>
        The database enforces <strong>row-level security</strong>: every query is scoped to the signed-in user, so you
        can only read your own profile and interview history. Sensitive operations (plan changes, usage counters) run
        server-side with restricted service credentials, never exposed to the browser.
      </p>

      <h2>Payments</h2>
      <p>
        Card payments are processed entirely by <strong>Stripe</strong> and <strong>Razorpay</strong>, which are
        PCI-DSS compliant. Intervue.ai never sees or stores your full card details.
      </p>

      <h2>Infrastructure</h2>
      <ul>
        <li>Hosted on Vercel and Supabase, with secrets kept in server-side environment variables only.</li>
        <li>API keys and service credentials are never shipped to the client bundle.</li>
        <li>AI processing is performed by Groq over encrypted connections.</li>
      </ul>

      <h2>Your part</h2>
      <p>
        Use a secure email account, don’t share your magic links, and sign out on shared devices. Account security
        starts with protecting your inbox, since that’s how sign-in links are delivered.
      </p>

      <h2>Responsible disclosure</h2>
      <p>
        Found a vulnerability? We’d love to hear from you. Email{' '}
        <a href="mailto:iarunrao01@gmail.com">iarunrao01@gmail.com</a> with details and steps to reproduce, and please
        give us reasonable time to fix it before any public disclosure. We won’t pursue good-faith security research.
      </p>
    </LegalShell>
  );
}
