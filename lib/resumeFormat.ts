import type { TailoredResume } from './types';

/** Render a tailored résumé as clean, copy/paste-ready Markdown. */
export function tailoredToMarkdown(r: TailoredResume): string {
  const lines: string[] = [];
  if (r.name) lines.push(`# ${r.name}`);
  if (r.headline) lines.push(`**${r.headline}**`);
  lines.push('');

  if (r.summary) lines.push('## Summary', r.summary, '');

  if (r.skills?.length) lines.push('## Skills', r.skills.join(' · '), '');

  if (r.experience?.length) {
    lines.push('## Experience');
    for (const exp of r.experience) {
      const head = [exp.title, exp.org].filter(Boolean).join(' — ');
      lines.push(`### ${head}${exp.period ? ` (${exp.period})` : ''}`);
      for (const bullet of exp.bullets ?? []) lines.push(`- ${bullet}`);
      lines.push('');
    }
  }

  if (r.education?.length) {
    lines.push('## Education');
    for (const ed of r.education) lines.push(`- ${ed}`);
    lines.push('');
  }

  return lines.join('\n').trim();
}
