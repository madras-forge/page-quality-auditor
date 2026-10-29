import { describe, expect, it } from 'vitest';
import { analyzePage, scoreFindings } from '../lib/analyze';
import { createDemoReport } from '../lib/demo';
import { toMarkdown } from '../lib/export';
import type { PageSource } from '../lib/types';
const source = (html: string): PageSource => ({
  html,
  requestedUrl: 'https://public.org/page',
  finalUrl: 'https://public.org/page',
  status: 200,
  bytes: 100,
  redirects: 0,
  robots: 'allowed',
});

describe('auditor evidence and rubric', () => {
  it('produces a stable synthetic demo and honest implementation score', () => {
    const report = createDemoReport();
    expect(report.findings).toHaveLength(24);
    expect(report.score).toEqual({
      value: 79,
      passed: 11,
      evaluated: 14,
      total: 14,
      coverage: 100,
    });
    expect(report.findings.filter((f) => f.state === 'fail').map((f) => f.id)).toEqual([
      'canonical',
      'image-alt',
      'field-labels',
    ]);
    expect(
      report.findings
        .filter((f) => f.method !== 'deterministic')
        .every((f) => f.state === 'review'),
    ).toBe(true);
    expect(report.findings.every((f) => f.evidence.observation && f.recommendation && f.why)).toBe(
      true,
    );
    expect(report).not.toHaveProperty('page.html');
  });
  it('finds page titles moved into body by malformed head markup and excludes SVG titles', () => {
    const report = analyzePage(
      source(
        '<html><body><title>Page title</title><svg><title>Icon label</title></svg></body></html>',
      ),
    );
    expect(report.page.title).toBe('Page title');
    expect(analyzePage(source('<body><svg><title>Icon only</title></svg></body>')).page.title).toBe(
      '',
    );
  });
  it('distinguishes a detected author from verified expertise', () => {
    const report = analyzePage(
      source(
        '<html><body><a rel="author">Dr Example</a><p>Medically reviewed by a person</p></body></html>',
      ),
    );
    const author = report.findings.find((f) => f.id === 'author')!;
    expect(author.evidence.observation).toContain('Dr Example');
    expect(author.state).toBe('review');
    expect(author.method).toBe('heuristic');
    expect(report.findings.find((f) => f.id === 'reviewer')?.state).toBe('review');
  });
  it('scores metadata and unknown optional JSON-LD without making indexing claims', () => {
    const report = analyzePage(
      source(
        '<html lang="en"><head><title>Example</title><meta name="robots" content="NOINDEX, follow"></head><body><h1>One</h1><h1>Two</h1></body></html>',
      ),
    );
    expect(report.findings.find((f) => f.id === 'html-robots')?.state).toBe('fail');
    expect(report.findings.find((f) => f.id === 'h1')?.state).toBe('fail');
    expect(report.findings.find((f) => f.id === 'jsonld')?.state).toBe('unknown');
    expect(report.score.coverage).toBe(93);
  });
  it('detects invalid JSON-LD but never treats schema type as verified eligibility', () => {
    const report = analyzePage(source('<script type="application/ld+json">{invalid</script>'));
    expect(report.findings.find((f) => f.id === 'jsonld')).toMatchObject({
      state: 'fail',
      evidence: { observation: expect.stringContaining('1 parse error') },
    });
  });
  it('checks static label associations, empty image alt and canonical resolution', () => {
    const report = analyzePage(
      source(
        '<html><head><link rel="canonical" href="/page"></head><body><img alt=""><label for="email">Email</label><input id="email"><button aria-label="Continue"></button><a href="/" aria-labelledby="name"></a><span id="name">Home</span></body></html>',
      ),
    );
    for (const id of ['image-alt', 'field-labels', 'button-labels', 'link-labels', 'canonical'])
      expect(report.findings.find((f) => f.id === id)?.state).toBe('pass');
  });
  it('withholds scores below coverage threshold and ignores heuristic states', () => {
    const f = createDemoReport().findings;
    const unknown = f.map((item) =>
      item.method === 'deterministic' ? { ...item, state: 'unknown' as const } : item,
    );
    expect(scoreFindings(unknown)).toMatchObject({ value: null, coverage: 0 });
    expect(
      scoreFindings(
        f.map((item) =>
          item.method !== 'deterministic' ? { ...item, state: 'pass' as const } : item,
        ),
      ),
    ).toEqual(scoreFindings(f));
  });
  it('exports actionable evidence and limitations with unsafe Markdown neutralized', () => {
    const report = createDemoReport();
    report.page.title = '<img onerror=alert(1)> [click](javascript:alert(1))';
    const md = toMarkdown(report);
    expect(md).toContain('hpqa-1.0.0');
    expect(md).toContain('Evidence (');
    expect(md).toContain('Action:');
    expect(md).toContain('Synthetic fixture');
    expect(md).not.toContain('<img');
    expect(md).not.toContain('[click]');
  });
});
