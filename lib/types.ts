export type Category = 'trust' | 'technical' | 'aeo' | 'cro';
export type Method = 'deterministic' | 'heuristic' | 'manual';
export type State = 'pass' | 'fail' | 'review' | 'unknown';
export type Priority = 'high' | 'medium' | 'low';
export interface Finding {
  id: string;
  category: Category;
  title: string;
  method: Method;
  state: State;
  priority: Priority;
  effort: 'Quick fix' | 'Moderate' | 'Editorial review';
  evidence: { selector: string; observation: string };
  why: string;
  recommendation: string;
}
export interface PageSource {
  requestedUrl: string;
  finalUrl: string;
  html: string;
  status: number;
  bytes: number;
  redirects: number;
  robots: 'allowed' | 'not-found' | 'demo';
}
export interface AuditReport {
  schemaVersion: '1.0';
  rubricVersion: 'hpqa-1.0.0';
  id: string;
  mode: 'demo' | 'live';
  auditedAt: string;
  page: Omit<PageSource, 'html'> & {
    title: string;
    description: string;
    language: string;
    wordCount: number;
  };
  findings: Finding[];
  score: {
    value: number | null;
    passed: number;
    evaluated: number;
    total: number;
    coverage: number;
  };
  limitations: string[];
}
export const CATEGORIES: { id: Category; title: string; short: string; description: string }[] = [
  {
    id: 'trust',
    title: 'Trust & credibility',
    short: 'Trust',
    description: 'YMYL & E-E-A-T signals',
  },
  {
    id: 'technical',
    title: 'Technical SEO',
    short: 'Technical',
    description: 'Crawl & on-page foundations',
  },
  {
    id: 'aeo',
    title: 'Answer readiness',
    short: 'AEO',
    description: 'Structure & answer discovery',
  },
  { id: 'cro', title: 'Conversion UX', short: 'CRO', description: 'Clarity & accessible actions' },
];
