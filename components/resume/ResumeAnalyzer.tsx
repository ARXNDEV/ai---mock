'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, Sparkles, Check, AlertTriangle, ArrowUpRight, Upload } from 'lucide-react';
import { analyzeResume } from '@/lib/api';
import type { ResumeAnalysis } from '@/lib/types';

const fieldStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--line-strong)',
  background: 'var(--card)',
  borderRadius: 'var(--r-sm)',
  padding: '14px 16px',
  fontFamily: 'var(--sans)',
  fontSize: 14,
  lineHeight: 1.6,
  color: 'var(--ink)',
  outline: 'none',
  resize: 'vertical',
};

/** Extract plain text from a PDF in the browser (best-effort). */
async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  // Worker is served as a static file from /public (copied from pdfjs-dist),
  // which avoids bundling the ESM worker through webpack/Terser.
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  let text = '';
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += `${content.items.map((it) => ('str' in it ? (it as { str: string }).str : '')).join(' ')}\n`;
  }
  return text.trim();
}

function List({
  title,
  items,
  icon,
  color,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  color: string;
}) {
  if (!items?.length) return null;
  return (
    <div className="feature" style={{ marginTop: 18 }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, color, fontSize: 20 }}>
        {icon} {title}
      </h3>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14, listStyle: 'none' }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
            <span style={{ color, flex: 'none', marginTop: 2 }}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ResumeAnalyzer({ isPro, initialRemaining }: { isPro: boolean; initialRemaining: number | null }) {
  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [atLimit, setAtLimit] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(initialRemaining);
  const [result, setResult] = useState<ResumeAnalysis | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const outOfCredits = !isPro && (remaining ?? 0) <= 0;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setParsing(true);
    setFileName(file.name);
    try {
      let text = '';
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        text = await extractPdfText(file);
        if (!text) throw new Error('empty');
      } else {
        text = await file.text();
      }
      setResume(text);
    } catch {
      setError("Couldn't read that file — please paste your résumé text instead.");
      setFileName(null);
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleAnalyze() {
    if (resume.trim().length < 40) {
      setError('Please add your full résumé text (at least a few lines).');
      return;
    }
    setLoading(true);
    setError(null);
    setAtLimit(false);
    try {
      const { analysis, remaining: left } = await analyzeResume({ resume, jd });
      setResult(analysis);
      setRemaining(left);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Analysis failed.';
      setError(msg);
      if (/upgrade to pro/i.test(msg)) setAtLimit(true);
    } finally {
      setLoading(false);
    }
  }

  const scoreColor =
    result && result.matchScore >= 70 ? 'var(--green)' : result && result.matchScore >= 45 ? 'var(--ochre)' : 'var(--accent)';

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="eyebrow">Your résumé</span>
            <button
              type="button"
              className="mono"
              onClick={() => fileRef.current?.click()}
              disabled={parsing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                color: 'var(--accent)',
                background: 'none',
                cursor: 'pointer',
              }}
            >
              {parsing ? <Loader2 width={13} height={13} className="animate-spin" /> : <Upload width={13} height={13} />}
              {parsing ? 'Reading…' : fileName ? fileName.slice(0, 22) : 'Upload PDF / TXT'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
          </div>
          <textarea
            style={{ ...fieldStyle, minHeight: 220 }}
            placeholder="Paste your résumé text — or upload a PDF/TXT above…"
            value={resume}
            onChange={(e) => setResume(e.target.value)}
          />
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Job description <span style={{ color: 'var(--ink-mute)' }}>(optional)</span>
          </div>
          <textarea
            style={{ ...fieldStyle, minHeight: 220 }}
            placeholder="Paste the job description to tailor the analysis…"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
        </div>
      </div>

      {outOfCredits ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
            You&apos;ve used your free analyses this month.
          </span>
          <Link href="/pricing" className="btn btn-accent">
            Upgrade to Pro for unlimited →
          </Link>
        </div>
      ) : (
        <button type="button" className="btn btn-accent" style={{ marginTop: 18 }} onClick={handleAnalyze} disabled={loading}>
          {loading ? <Loader2 width={18} height={18} className="animate-spin" /> : <Sparkles width={18} height={18} />}
          {loading ? 'Analyzing…' : 'Analyze résumé'}
        </button>
      )}

      {!isPro && remaining !== null && !outOfCredits && (
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', marginLeft: 14 }}>
          {remaining} free left this month
        </span>
      )}

      {error && (
        <div style={{ marginTop: 14 }}>
          <p className="mono" style={{ color: 'var(--accent)', fontSize: 13 }}>
            {error}
          </p>
          {atLimit && (
            <Link href="/pricing" className="btn btn-accent" style={{ marginTop: 10 }}>
              Upgrade to Pro →
            </Link>
          )}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 28 }}>
          <div className="feature" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="serif" style={{ fontSize: 64, lineHeight: 1, color: scoreColor }}>
                {result.matchScore}
                <span style={{ fontSize: 22, color: 'var(--ink-mute)' }}>/100</span>
              </div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginTop: 6 }}>
                Match score
              </div>
            </div>
            <p style={{ flex: 1, minWidth: 240, fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{result.summary}</p>
          </div>

          <List title="Strengths" items={result.strengths} color="var(--green)" icon={<Check width={18} height={18} />} />
          <List title="Gaps" items={result.gaps} color="var(--ochre)" icon={<AlertTriangle width={18} height={18} />} />
          <List title="Prioritized fixes" items={result.suggestions} color="var(--accent)" icon={<ArrowUpRight width={18} height={18} />} />
        </div>
      )}
    </div>
  );
}
