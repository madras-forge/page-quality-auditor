import type { AuditReport } from './types';
// Remove Markdown control characters and HTML delimiters from untrusted evidence.
const plain = (s: string) => s.replace(/[<>`*_\[\]#|\\]/g, '').replace(/[\r\n]+/g, ' ');
export function toMarkdown(report: AuditReport): string {
  return [
    '# Page Quality Audit Report · Healthcare profile',
    `Mode: ${report.mode.toUpperCase()} | Audited: ${report.auditedAt} | Rubric: ${report.rubricVersion}`,
    `Page: ${plain(report.page.finalUrl)}`,
    `Title: ${plain(report.page.title)}`,
    `Implementation score: ${report.score.value ?? 'Insufficient evidence'} / 100. Deterministic coverage: ${report.score.coverage}%.`,
    'Only deterministic checks affect the score. Heuristics and manual judgments need review.',
    '## Findings',
    ...report.findings.map(
      (f) =>
        `### ${plain(f.title)}\n\n${f.state.toUpperCase()} · ${f.method} · ${f.priority} priority · ${f.effort}\n\nEvidence (${plain(f.evidence.selector)}): ${plain(f.evidence.observation)}\n\nWhy: ${plain(f.why)}\n\nAction: ${plain(f.recommendation)}`,
    ),
    '## Scope & limitations',
    ...report.limitations.map((s) => `- ${s}`),
  ].join('\n\n');
}
