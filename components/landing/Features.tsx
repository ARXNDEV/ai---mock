'use client';

import { useEffect, useRef } from 'react';
import { Mic, FileText, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  no: string;
  title: string;
  body: string;
  tag: string;
}

const features: Feature[] = [
  {
    icon: Mic,
    no: '01',
    title: 'AI Mock Interviews',
    body: 'Role-specific questions tailored to your target job, asked by a realistic conversational AI interviewer that adapts to your answers.',
    tag: 'Voice + Text',
  },
  {
    icon: FileText,
    no: '02',
    title: 'Resume Analyzer',
    body: 'Upload your resume and the job description — get an instant gap analysis with prioritized, concrete fixes before you apply.',
    tag: 'Gap Analysis',
  },
  {
    icon: BarChart3,
    no: '03',
    title: 'Instant Feedback',
    body: 'A clear score, your standout strengths, and specific improvements after every single answer — no waiting, no guessing.',
    tag: 'Per Answer',
  },
];

/** Adds the `.in` reveal class to elements as they scroll into view. */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = root.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);
  return ref;
}

export function Features() {
  const ref = useScrollReveal();
  return (
    <section className="section" id="features" ref={ref}>
      <div className="sec-head reveal">
        <div>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            Features
          </div>
          <h2>
            Everything you need to <em>crack</em> interviews.
          </h2>
        </div>
      </div>
      <div className="features">
        {features.map((f, i) => (
          <div className="feature reveal" key={f.no} style={{ transitionDelay: `${(i % 3) * 0.09}s` }}>
            <div className="feat-top">
              <div className="feat-ico">
                <f.icon className="ico" strokeWidth={1.6} />
              </div>
              <div className="feat-no num">{f.no}</div>
            </div>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
            <div className="f-tag">{f.tag}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
