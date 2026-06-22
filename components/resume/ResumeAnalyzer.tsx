'use client';

import { useState } from 'react';
import { Loader2, Sparkles, Check, AlertTriangle, ArrowUpRight } from 'lucide-react';
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

export function ResumeAnalyzer() {
  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResumeAnalysis | null>(null);

  async function handleAnalyze() {
    if (resume.trim().length < 40) {
      setError('Please paste your full resume text (at least a few lines).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeResume({ resume, jd });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = result && result.matchScore >= 70 ? 'var(--green)' : result && result.matchScore >= 45 ? 'var(--ochre)' : 'var(--accent)';

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Your résumé
          </div>
          <textarea
            style={{ ...fieldStyle, minHeight: 220 }}
            placeholder="Paste your resume text here…"
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

      <button
        type="button"
        className="btn btn-accent"
        style={{ marginTop: 18 }}
        onClick={handleAnalyze}
        disabled={loading}
      >
        {loading ? <Loader2 width={18} height={18} className="animate-spin" /> : <Sparkles width={18} height={18} />}
        {loading ? 'Analyzing…' : 'Analyze résumé'}
      </button>

      {error && (
        <p className="mono" style={{ color: 'var(--accent)', fontSize: 13, marginTop: 14 }}>
          {error}
        </p>
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
            <p style={{ flex: 1, minWidth: 240, fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              {result.summary}
            </p>
          </div>

          <List title="Strengths" items={result.strengths} color="var(--green)" icon={<Check width={18} height={18} />} />
          <List title="Gaps" items={result.gaps} color="var(--ochre)" icon={<AlertTriangle width={18} height={18} />} />
          <List title="Prioritized fixes" items={result.suggestions} color="var(--accent)" icon={<ArrowUpRight width={18} height={18} />} />
        </div>
      )}
    </div>
  );
}
