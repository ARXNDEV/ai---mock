'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Mic, FileText, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Reveal, RevealItem, fadeUpItem } from '@/components/motion/Reveal';

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

export function Features() {
  const reduce = useReducedMotion();

  return (
    <section className="section" id="features">
      <Reveal className="sec-head">
        <RevealItem>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            Features
          </div>
          <h2>
            Everything you need to <em>crack</em> interviews.
          </h2>
        </RevealItem>
      </Reveal>

      <Reveal className="features" stagger={0.1}>
        {features.map((f) => (
          <motion.div
            className="feature"
            key={f.no}
            variants={fadeUpItem}
            whileHover={reduce ? undefined : { y: -6, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          >
            <div className="feat-top">
              <div className="feat-ico">
                <f.icon className="ico" strokeWidth={1.6} />
              </div>
              <div className="feat-no num">{f.no}</div>
            </div>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
            <div className="f-tag">{f.tag}</div>
          </motion.div>
        ))}
      </Reveal>
    </section>
  );
}
