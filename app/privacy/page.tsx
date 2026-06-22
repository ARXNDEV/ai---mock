import type { Metadata } from 'next';
import { LegalShell } from '@/components/legal/LegalShell';

export const metadata: Metadata = {
  title: 'Privacy Policy — Intervue.ai',
  description: 'How Intervue.ai collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      updated="June 22, 2026"
      intro="This policy explains what data Intervue.ai collects when you practice interviews, how we use it, and the choices you have. We collect only what we need to run the product."
    >
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details</strong> — your email address, provided directly or via Google sign-in, used to create
          and secure your account.
        </li>
        <li>
          <strong>Interview content</strong> — the audio you record, its transcript, the questions asked, and the AI
          feedback and scores generated for your answers.
        </li>
        <li>
          <strong>Résumé content</strong> — résumé and job-description text you paste or upload to the Résumé Analyzer.
        </li>
        <li>
          <strong>Usage data</strong> — your plan, interview/résumé counts, session history, and basic technical logs
          needed to operate and debug the service.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To generate interview questions, transcribe your answers, and produce feedback and scores.</li>
        <li>To analyze your résumé against a job description and build tailored versions.</li>
        <li>To track your plan and monthly usage limits, and to show your practice history.</li>
        <li>To maintain security, prevent abuse, and improve the product.</li>
      </ul>
      <p>
        We do <strong>not</strong> sell your personal data, and we do not use your interview or résumé content to train
        our own models.
      </p>

      <h2>Service providers</h2>
      <p>We share data only with the processors needed to run Intervue.ai:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — authentication and database (your account, profile, and session history).
        </li>
        <li>
          <strong>Groq</strong> — the AI models that generate questions, transcribe audio, score answers, and analyze
          résumés. Content is sent for processing to return your results.
        </li>
        <li>
          <strong>Stripe & Razorpay</strong> — payment processing for Pro upgrades. We never store your full card
          details; payments are handled directly by these providers.
        </li>
        <li>
          <strong>Vercel</strong> — application hosting and delivery.
        </li>
      </ul>

      <h2>Data retention</h2>
      <p>
        Your account data and session history are kept while your account is active so you can review past interviews.
        You can delete individual data or request deletion of your account at any time, after which we remove your
        personal data except where we must retain it for legal or accounting reasons.
      </p>

      <h2>Your rights</h2>
      <p>
        You can access, correct, export, or delete your personal data. To exercise these rights, contact us at{' '}
        <a href="mailto:iarunrao01@gmail.com">iarunrao01@gmail.com</a>. Depending on your region (e.g. GDPR/CCPA), you may
        have additional rights, which we honor.
      </p>

      <h2>Children</h2>
      <p>Intervue.ai is not directed to children under 16, and we do not knowingly collect their data.</p>

      <h2>Changes & contact</h2>
      <p>
        We may update this policy as the product evolves; we’ll revise the “last updated” date above. Questions? Reach us
        at <a href="mailto:iarunrao01@gmail.com">iarunrao01@gmail.com</a>.
      </p>
    </LegalShell>
  );
}
