'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Sparkles,
  Wand2,
  Check,
  AlertTriangle,
  ArrowUpRight,
  Upload,
  Copy,
  Download,
} from 'lucide-react';
import { analyzeResume, buildTailoredResume } from '@/lib/api';
import { tailoredToMarkdown } from '@/lib/resumeFormat';
import type { ResumeAnalysis, TailoredResume } from '@/lib/types';

type Mode = 'build' | 'analyze';

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

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
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
  const [mode, setMode] = useState<Mode>('build');
  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [atLimit, setAtLimit] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(initialRemaining);
  const [result, setResult] = useState<ResumeAnalysis | null>(null);
  const [built, setBuilt] = useState<TailoredResume | null>(null);
  const [copied, setCopied] = useState(false);
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

  async function run() {
    if (resume.trim().length < 40) {
      setError('Please add your full résumé text (at least a few lines).');
      return;
    }
    setLoading(true);
    setError(null);
    setAtLimit(false);
    try {
      if (mode === 'analyze') {
        const { analysis, remaining: left } = await analyzeResume({ resume, jd });
        setResult(analysis);
        setBuilt(null);
        setRemaining(left);
      } else {
        const { resume: tailored, remaining: left } = await buildTailoredResume({ resume, jd });
        setBuilt(tailored);
        setResult(null);
        setRemaining(left);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      setError(msg);
      if (/upgrade to pro/i.test(msg)) setAtLimit(true);
    } finally {
      setLoading(false);
    }
  }

  async function copyBuilt() {
    if (!built) return;
    try {
      await navigator.clipboard.writeText(tailoredToMarkdown(built));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  function downloadBuilt() {
    if (!built) return;
    const blob = new Blob([tailoredToMarkdown(built)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(built.name || 'resume').trim().replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const scoreColor =
    result && result.matchScore >= 70 ? 'var(--green)' : result && result.matchScore >= 45 ? 'var(--ochre)' : 'var(--accent)';

  return (
    <div>
      <div className="price-toggle" style={{ marginBottom: 18 }}>
        <button className={mode === 'build' ? 'active' : ''} onClick={() => setMode('build')}>
          ✦ Build tailored
        </button>
        <button className={mode === 'analyze' ? 'active' : ''} onClick={() => setMode('analyze')}>
          Analyze
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="eyebrow">Your résumé</span>
            <button
              type="button"
              className="mono"
              onClick={() => fileRef.current?.click()}
              disabled={parsing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--accent)', background: 'none', cursor: 'pointer' }}
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
            Target job description {mode === 'build' ? '' : <span style={{ color: 'var(--ink-mute)' }}>(optional)</span>}
          </div>
          <textarea
            style={{ ...fieldStyle, minHeight: 220 }}
            placeholder="Paste the job description to tailor to it…"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
        </div>
      </div>

      {outOfCredits ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>You&apos;ve used your free résumé credits this month.</span>
          <Link href="/pricing" className="btn btn-accent">
            Upgrade to Pro for unlimited →
          </Link>
        </div>
      ) : (
        <button type="button" className="btn btn-accent" style={{ marginTop: 18 }} onClick={run} disabled={loading}>
          {loading ? (
            <Loader2 width={18} height={18} className="animate-spin" />
          ) : mode === 'build' ? (
            <Wand2 width={18} height={18} />
          ) : (
            <Sparkles width={18} height={18} />
          )}
          {loading
            ? mode === 'build'
              ? 'Building…'
              : 'Analyzing…'
            : mode === 'build'
              ? 'Build tailored résumé'
              : 'Analyze résumé'}
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

      {/* ANALYZE result */}
      {mode === 'analyze' && result && (
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

      {/* BUILD result */}
      {mode === 'build' && built && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <div className="eyebrow">Your tailored résumé</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-line btn-sm" onClick={copyBuilt}>
                {copied ? <Check width={15} height={15} /> : <Copy width={15} height={15} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button type="button" className="btn btn-line btn-sm" onClick={downloadBuilt}>
                <Download width={15} height={15} /> .md
              </button>
            </div>
          </div>

          <div className="feature">
            {built.name && (
              <div className="serif" style={{ fontSize: 30, lineHeight: 1.05 }}>
                {built.name}
              </div>
            )}
            {built.headline && (
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginTop: 6 }}>
                {built.headline}
              </div>
            )}
            {built.summary && (
              <p style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.6, marginTop: 14 }}>{built.summary}</p>
            )}

            {built.skills?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
                {built.skills.map((s, i) => (
                  <span
                    key={i}
                    className="mono"
                    style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: 'var(--card-2)', border: '1px solid var(--line)', color: 'var(--ink-soft)' }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {built.experience?.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 12 }}>
                  Experience
                </div>
                {built.experience.map((exp, i) => (
                  <div key={i} style={{ marginBottom: 18 }}>
                    <div className="serif" style={{ fontSize: 18 }}>
                      {[exp.title, exp.org].filter(Boolean).join(' · ')}
                    </div>
                    {exp.period && (
                      <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
                        {exp.period}
                      </div>
                    )}
                    <ul style={{ listStyle: 'disc', paddingLeft: 18, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {exp.bullets?.map((b, j) => (
                        <li key={j} style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {built.education?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 8 }}>
                  Education
                </div>
                {built.education.map((ed, i) => (
                  <div key={i} style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
                    {ed}
                  </div>
                ))}
              </div>
            )}
          </div>

          <List title="ATS keywords covered" items={built.atsKeywords} color="var(--green)" icon={<Check width={18} height={18} />} />
          <List title="What we tailored" items={built.changes} color="var(--accent)" icon={<Wand2 width={18} height={18} />} />
        </div>
      )}
    </div>
  );
}
