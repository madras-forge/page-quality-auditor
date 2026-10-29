'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Code2,
  Compass,
  Download,
  ExternalLink,
  FileJson,
  FileText,
  Globe2,
  HeartPulse,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Microscope,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import type { AuditReport, Category, Finding, Method, State } from '../lib/types';
import { CATEGORIES } from '../lib/types';
import { toMarkdown } from '../lib/export';

type View = 'overview' | 'findings' | 'plan' | 'methodology';
const categoryIcons = { trust: ShieldCheck, technical: Code2, aeo: Sparkles, cro: Target };
const stateLabels: Record<State, string> = {
  pass: 'Passed',
  fail: 'Needs attention',
  review: 'Human review',
  unknown: 'Not assessed',
};
const methodLabels: Record<Method, string> = {
  deterministic: 'Observed fact',
  heuristic: 'Heuristic signal',
  manual: 'Manual check',
};
const priorities = { high: 0, medium: 1, low: 2 };

function StateBadge({ state }: { state: State }) {
  return (
    <span className={`state-badge ${state}`}>
      <span className="status-dot" />
      {stateLabels[state]}
    </span>
  );
}
function FindingCard({ finding, forceOpen = false }: { finding: Finding; forceOpen?: boolean }) {
  const Icon = categoryIcons[finding.category];
  return (
    <details className={`finding ${finding.state}`} open={forceOpen || undefined}>
      <summary>
        <span className={`finding-icon ${finding.category}`}>
          <Icon size={17} aria-hidden="true" />
        </span>
        <span className="finding-title">
          <strong>{finding.title}</strong>
          <span>
            {CATEGORIES.find((c) => c.id === finding.category)?.title}
            <span className="dot-separator">·</span>
            {methodLabels[finding.method]}
          </span>
        </span>
        <span className={`priority priority-${finding.priority}`}>{finding.priority}</span>
        <StateBadge state={finding.state} />
        <ChevronDown className="disclosure-arrow" size={16} aria-hidden="true" />
      </summary>
      <div className="finding-body">
        <div className="evidence-block">
          <span className="eyebrow">
            <Microscope size={13} />
            Evidence from this page
          </span>
          <code>{finding.evidence.selector}</code>
          <p>{finding.evidence.observation}</p>
        </div>
        <div className="finding-explanation">
          <div>
            <h4>What this tells us</h4>
            <p>{finding.why}</p>
          </div>
          <div>
            <h4>
              Recommended next step <span>{finding.effort}</span>
            </h4>
            <p>{finding.recommendation}</p>
          </div>
        </div>
      </div>
    </details>
  );
}

export default function Dashboard({ initialReport }: { initialReport: AuditReport }) {
  const [report, setReport] = useState(initialReport);
  const [announcement, setAnnouncement] = useState('');
  const [view, setView] = useState<View>('overview');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [method, setMethod] = useState<Method | 'all'>('all');
  const [state, setState] = useState<State | 'all'>('all');
  const [query, setQuery] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const reportHeading = useRef<HTMLHeadingElement>(null);
  const pageHeading = useRef<HTMLHeadingElement>(null);
  const exportButton = useRef<HTMLButtonElement>(null);
  const navButton = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!exportRef.current?.contains(event.target as Node)) setExportOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (exportRef.current?.contains(document.activeElement)) exportButton.current?.focus();
        if (sidebarRef.current?.contains(document.activeElement)) navButton.current?.focus();
        setExportOpen(false);
        setMobileNav(false);
      }
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  const failures = report.findings.filter((f) => f.state === 'fail');
  const reviews = report.findings.filter((f) => f.state === 'review');
  const unknown = report.findings.filter((f) => f.state === 'unknown');
  const actions = [...failures, ...reviews].sort(
    (a, b) =>
      priorities[a.priority] - priorities[b.priority] ||
      (a.state === 'fail' ? 0 : 1) - (b.state === 'fail' ? 0 : 1),
  );
  const visible = report.findings.filter(
    (f) =>
      (category === 'all' || f.category === category) &&
      (method === 'all' || f.method === method) &&
      (state === 'all' || f.state === state) &&
      `${f.title} ${f.evidence.observation} ${f.recommendation}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  function go(next: View) {
    setView(next);
    setMobileNav(false);
    setAnnouncement('');
    window.setTimeout(() => pageHeading.current?.focus(), 0);
  }
  function resetFilters() {
    setCategory('all');
    setMethod('all');
    setState('all');
    setQuery('');
  }
  function resetDemo() {
    setReport({ ...initialReport, id: crypto.randomUUID(), auditedAt: new Date().toISOString() });
    setView('overview');
    resetFilters();
    setAnnouncement('Sample report reset. This is a fictional page.');
    window.setTimeout(() => reportHeading.current?.focus(), 0);
  }
  function download(format: 'json' | 'md') {
    const blob = new Blob(
      [format === 'json' ? JSON.stringify(report, null, 2) : toMarkdown(report)],
      { type: format === 'json' ? 'application/json' : 'text/markdown;charset=utf-8' },
    );
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `page-quality-${report.mode}-report.${format}`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    setExportOpen(false);
    setAnnouncement(`${format === 'json' ? 'JSON' : 'Markdown'} report downloaded.`);
  }

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <aside
        ref={sidebarRef}
        className={`sidebar ${mobileNav ? 'is-open' : ''}`}
        aria-label="Main navigation"
      >
        <a
          className="brand"
          href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/`}
          aria-label="Page Quality Auditor home"
        >
          <span className="brand-mark">
            <Activity size={24} strokeWidth={2.3} />
          </span>
          <span className="brand-name">
            Page Quality
            <br />
            Auditor
          </span>
        </a>
        <button
          className="mobile-close icon-button"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
        <div className="workspace-label">
          <span className="workspace-icon">
            <HeartPulse size={16} />
          </span>
          <div>
            Audit workspace<small>Healthcare profile</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {(
            [
              { id: 'overview', text: 'Overview', icon: LayoutDashboard },
              { id: 'findings', text: 'All findings', icon: Layers3 },
              { id: 'plan', text: 'Action plan', icon: ClipboardList },
            ] as const
          ).map(({ id, text, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${view === id ? 'active' : ''}`}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => go(id)}
            >
              <Icon size={18} />
              {text}
              {id === 'findings' && <span className="nav-count">{report.findings.length}</span>}
              {id === 'plan' && <span className="nav-dot" />}
            </button>
          ))}
          <span className="nav-label resources-label">RESOURCES</span>
          <button
            className={`nav-item ${view === 'methodology' ? 'active' : ''}`}
            aria-current={view === 'methodology' ? 'page' : undefined}
            onClick={() => go('methodology')}
          >
            <BookOpen size={18} />
            Our methodology
            <ArrowUpRight className="nav-trail" size={14} />
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="tiny-label">
              <ShieldCheck size={14} />
              Built on evidence
            </span>
            <p>
              Clear signals.
              <br />
              Honest limitations.
              <br />
              Better decisions.
            </p>
            <button onClick={() => go('methodology')}>
              See how we audit <ArrowRight size={14} />
            </button>
          </div>
          <div className="sidebar-footer">
            <span className="avatar">PQ</span>
            <div>
              Page Quality Auditor<small>Healthcare profile · v1.0</small>
            </div>
            <LockKeyhole size={14} />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              ref={navButton}
              className="mobile-toggle icon-button"
              onClick={() => setMobileNav(!mobileNav)}
              aria-label="Open navigation"
              aria-expanded={mobileNav}
            >
              <Menu size={21} />
            </button>
            <span className="desktop-crumb">Workspace</span>
            <ChevronRight className="desktop-crumb" size={14} />
            <strong>
              {view === 'overview'
                ? 'Page audit'
                : view === 'findings'
                  ? 'All findings'
                  : view === 'plan'
                    ? 'Action plan'
                    : 'Methodology'}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="privacy-note">
              <LockKeyhole size={13} />
              Private by design
            </span>
            <span className="topbar-divider" />
            <button
              className="icon-button"
              aria-label="About this audit methodology"
              onClick={() => go('methodology')}
            >
              <CircleHelp size={19} />
            </button>
            <span className="avatar topbar-avatar">PQ</span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <div className="page-intro">
            <div>
              <div className="eyebrow page-eyebrow">
                <span className="status-dot" />
                PAGE QUALITY AUDITOR
              </div>
              <h1
                ref={pageHeading}
                tabIndex={-1}
                className={view === 'overview' ? 'sr-only' : undefined}
              >
                {view === 'overview'
                  ? 'Page Quality Auditor'
                  : view === 'findings'
                    ? 'Every signal. All the evidence.'
                    : view === 'plan'
                      ? 'Make the next change count.'
                      : 'Evidence before opinions.'}
              </h1>
              {view !== 'overview' && (
                <p>
                  {view === 'findings'
                    ? 'Explore what we observed, what needs attention, and what needs a person.'
                    : view === 'plan'
                      ? 'A practical review queue, ordered by priority. Start with the evidence.'
                      : 'Understand what we check, how we score, and where human judgment matters.'}
                </p>
              )}
            </div>
            <span className="edition-tag">
              <HeartPulse size={15} />
              Healthcare profile
            </span>
          </div>
          <section className="audit-input-card" aria-labelledby="sample-title">
            <div className="audit-input-label">
              <h2 id="sample-title">Explore the sample audit</h2>
              <span>24 checks. Four perspectives.</span>
            </div>
            <div className="sample-row">
              <span className="sample-source-icon">
                <Globe2 size={22} aria-hidden="true" />
              </span>
              <div className="sample-source">
                <strong>Northstar Health · fictional provider</strong>
                <p className="sample-url">
                  {initialReport.page.finalUrl.replace(/^https?:\/\//, '')}
                </p>
              </div>
              <button className="button primary" onClick={resetDemo}>
                Reset demo
                <ArrowRight size={15} />
              </button>
            </div>
            <p className="deployment-note">
              Interactive sample report. No websites are fetched, and no sign-in is required.
            </p>
          </section>
          <div className="sr-only" role="status" aria-live="polite">
            {announcement}
          </div>
          {view === 'methodology' ? (
            <Methodology />
          ) : (
            <>
              <section className="report-header" aria-label="Report details">
                <div className="report-identity">
                  <span className="site-icon">
                    <Globe2 size={22} />
                  </span>
                  <div>
                    <div className="report-label">
                      <h2 ref={reportHeading} tabIndex={-1}>
                        Your page, under the lens
                      </h2>
                      <span className={`mode-tag ${report.mode}`}>
                        {report.mode === 'demo' ? 'SAMPLE REPORT' : 'LIVE REPORT'}
                      </span>
                    </div>
                    <p className="report-url">{report.page.finalUrl.replace(/^https?:\/\//, '')}</p>
                  </div>
                </div>
                <div className="report-tools">
                  <span className="timestamp">
                    {new Date(report.auditedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      timeZone: 'UTC',
                    })}{' '}
                    · UTC
                  </span>
                  <div ref={exportRef} className="export-wrap">
                    <button
                      ref={exportButton}
                      className="button secondary export-toggle"
                      aria-expanded={exportOpen}
                      aria-controls="export-options"
                      onClick={() => setExportOpen(!exportOpen)}
                    >
                      <Download size={15} />
                      Export report
                      <ChevronDown size={13} />
                    </button>
                    {exportOpen && (
                      <div id="export-options" className="export-menu">
                        <button onClick={() => download('md')}>
                          <FileText size={16} />
                          Markdown report
                        </button>
                        <button onClick={() => download('json')}>
                          <FileJson size={16} />
                          JSON with evidence
                        </button>
                        <button
                          onClick={() => {
                            setExportOpen(false);
                            window.print();
                          }}
                        >
                          <Printer size={16} />
                          Print / Save as PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>
              {report.mode === 'demo' && (
                <div className="demo-note">
                  <Compass size={15} />
                  <span>
                    You’re exploring a fictional healthcare page. No real provider has been audited.
                  </span>
                </div>
              )}
              {view === 'overview' && (
                <>
                  <section className="overview-grid" aria-label="Audit summary">
                    <div className="score-panel">
                      <div className="section-kicker">
                        THE BIG PICTURE<span className="rubric-pill">{report.rubricVersion}</span>
                      </div>
                      <div className="score-content">
                        <div
                          className="score-ring"
                          style={{ '--score': report.score.value ?? 0 } as React.CSSProperties}
                          role="img"
                          aria-label={`Implementation score ${report.score.value ?? 'insufficient evidence'} out of 100`}
                        >
                          <div>
                            <strong>{report.score.value ?? '—'}</strong>
                            <span>/ 100</span>
                          </div>
                        </div>
                        <div className="score-copy">
                          <span className="score-caption">Implementation score</span>
                          <h3>
                            {report.score.value === null
                              ? 'More evidence needed'
                              : failures.length
                                ? 'A solid start. Room to improve.'
                                : 'The foundations look good.'}
                          </h3>
                          <p>
                            {report.score.passed} of {report.score.evaluated} evaluated checks
                            passed.
                            <br />
                            {report.score.coverage}% deterministic coverage.
                          </p>
                          <button className="text-button" onClick={() => go('methodology')}>
                            How this is calculated
                            <ArrowUpRight size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="score-disclaimer">
                        <CircleHelp size={13} />
                        <span>
                          Markup implementation only. Clinical quality and E-E-A-T require human
                          review.
                        </span>
                      </div>
                    </div>
                    <div className="next-panel">
                      <div className="section-kicker">
                        <span className="next-spark">
                          <Sparkles size={14} />
                        </span>
                        YOUR NEXT BEST STEP
                      </div>
                      <h3>{actions[0]?.title ?? 'Review the full page experience'}</h3>
                      <p>
                        {actions[0]?.recommendation ??
                          'The automated checks have passed. Ask a reviewer to assess the page in its full context.'}
                      </p>
                      <div className="next-panel-bottom">
                        <span className="light-priority">
                          <span className="status-dot" />
                          {actions[0]?.priority ?? 'medium'} priority
                        </span>
                        <button onClick={() => go('plan')}>
                          View action plan
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  </section>
                  <div className="perspectives-heading">
                    <h2>Four perspectives. One clearer picture.</h2>
                    <span>
                      Choose an area to explore
                      <ArrowDownToLine size={12} />
                    </span>
                  </div>
                  <section className="category-grid" aria-label="Audit categories">
                    {CATEGORIES.map((c) => {
                      const Icon = categoryIcons[c.id];
                      const items = report.findings.filter((f) => f.category === c.id);
                      const pass = items.filter((f) => f.state === 'pass').length;
                      const fail = items.filter((f) => f.state === 'fail').length;
                      const reviewCount = items.filter((f) => f.state === 'review').length;
                      return (
                        <button
                          key={c.id}
                          className={`category-card ${c.id}`}
                          onClick={() => {
                            resetFilters();
                            setCategory(c.id);
                            setView('findings');
                          }}
                        >
                          <span className="category-top">
                            <span className={`category-icon ${c.id}`}>
                              <Icon size={20} />
                            </span>
                            <ArrowUpRight size={15} />
                          </span>
                          <h3>{c.title}</h3>
                          <p>{c.description}</p>
                          <div className="category-stats">
                            <strong>
                              {c.id === 'trust'
                                ? `${reviewCount} to review`
                                : `${pass} / ${items.filter((f) => f.method === 'deterministic').length} passed`}
                            </strong>
                            <span>
                              {c.id === 'trust'
                                ? 'Human judgment'
                                : fail
                                  ? `${fail} to fix`
                                  : reviewCount
                                    ? `${reviewCount} review`
                                    : 'View checks'}
                            </span>
                          </div>
                          <div className="category-meter">
                            {items.map((f) => (
                              <span key={f.id} className={f.state} />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </section>
                </>
              )}
              {view === 'plan' ? (
                <section className="plan-section">
                  <div className="section-heading">
                    <div>
                      <h2>Your prioritised action plan</h2>
                      <p>
                        Implementation fixes and human reviews share a queue, with their methods
                        clearly marked.
                      </p>
                    </div>
                    <span className="count-pill">{actions.length} actions</span>
                  </div>
                  <div className="plan-note">
                    <ClipboardList size={17} />
                    <p>
                      Priority reflects this project’s rubric, not a measured ranking or revenue
                      impact. Confirm page intent before making changes.
                    </p>
                  </div>
                  {actions.map((f, index) => (
                    <div className="action-row" key={f.id}>
                      <span className="action-number">{String(index + 1).padStart(2, '0')}</span>
                      <FindingCard finding={f} />
                    </div>
                  ))}
                </section>
              ) : (
                <section
                  className="findings-section"
                  id="findings"
                  aria-labelledby="findings-title"
                >
                  <div className="section-heading">
                    <div>
                      <h2 id="findings-title">
                        From signals to next steps{' '}
                        <span className="heading-count">{report.findings.length}</span>
                      </h2>
                      <p>Every finding has a source. Every recommendation has a reason.</p>
                    </div>
                    <button
                      className="text-button evidence-guide"
                      onClick={() => go('methodology')}
                    >
                      <Microscope size={14} />
                      Evidence guide
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                  <div className="findings-card">
                    <div
                      className="category-tabs"
                      role="group"
                      aria-label="Filter findings by category"
                    >
                      <button
                        className={category === 'all' ? 'selected' : ''}
                        aria-pressed={category === 'all'}
                        onClick={() => setCategory('all')}
                      >
                        All findings<span>{report.findings.length}</span>
                      </button>
                      {CATEGORIES.map((c) => (
                        <button
                          key={c.id}
                          className={category === c.id ? 'selected' : ''}
                          aria-pressed={category === c.id}
                          onClick={() => setCategory(c.id)}
                        >
                          {c.short}
                        </button>
                      ))}
                    </div>
                    <div className="findings-filters">
                      <label className="finding-search">
                        <Search size={16} />
                        <span className="sr-only">Search findings</span>
                        <input
                          type="search"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search findings…"
                        />
                      </label>
                      <div className="select-filters">
                        <label>
                          <span className="sr-only">Check method</span>
                          <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value as Method | 'all')}
                          >
                            <option value="all">All methods</option>
                            <option value="deterministic">Observed facts</option>
                            <option value="heuristic">Heuristic signals</option>
                            <option value="manual">Manual checks</option>
                          </select>
                        </label>
                        <label>
                          <span className="sr-only">Finding status</span>
                          <select
                            value={state}
                            onChange={(e) => setState(e.target.value as State | 'all')}
                          >
                            <option value="all">All statuses</option>
                            {Object.entries(stateLabels).map(([id, label]) => (
                              <option value={id} key={id}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                    <div className="table-header">
                      <span>FINDING & METHOD</span>
                      <span>PRIORITY</span>
                      <span>STATUS</span>
                    </div>
                    <div className="findings-list">
                      {visible.length ? (
                        visible.map((f) => <FindingCard key={f.id} finding={f} />)
                      ) : (
                        <div className="empty-state">
                          <Search size={28} />
                          <h3>No findings match these filters</h3>
                          <p>Try another search or reset the filters to see all evidence.</p>
                          <button className="button secondary" onClick={resetFilters}>
                            Reset filters
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="findings-footer">
                      <span aria-live="polite">
                        Showing {visible.length} of {report.findings.length} findings
                      </span>
                      <span className="legend">
                        <span className="legend-item">
                          <i className="pass" />
                          {report.score.passed} passed
                        </span>
                        <span className="legend-item">
                          <i className="fail" />
                          {failures.length} attention
                        </span>
                        <span className="legend-item">
                          <i className="review" />
                          {reviews.length} review
                        </span>
                        {unknown.length > 0 && (
                          <span className="legend-item">
                            <i className="unknown" />
                            {unknown.length} unassessed
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </section>
              )}
              <section className="scope-panel">
                <div className="scope-heading">
                  <span className="scope-icon">
                    <Microscope size={19} />
                  </span>
                  <div>
                    <h2>A focused audit. An honest scope.</h2>
                    <p>What this report can—and can’t—tell you.</p>
                  </div>
                  <span className="scope-tag">1 PAGE ANALYSED</span>
                </div>
                <div className="scope-columns">
                  <div>
                    <h3>
                      <CheckCheck size={15} />
                      What we observed
                    </h3>
                    <p>
                      Static HTML, metadata, link and form markup. HTTP {report.page.status} ·{' '}
                      {(report.page.bytes / 1024).toFixed(1)} KB HTML · {report.page.redirects}{' '}
                      redirects.
                    </p>
                    <p>
                      Robots:{' '}
                      {report.page.robots === 'demo'
                        ? 'not fetched in demo mode'
                        : report.page.robots === 'allowed'
                          ? 'allowed by robots.txt'
                          : 'robots.txt returned 404/410'}
                      .
                    </p>
                  </div>
                  <div>
                    <h3>
                      <CircleHelp size={15} />
                      What needs a person
                    </h3>
                    <p>
                      Clinical accuracy, genuine credentials, source quality, visual accessibility
                      and the complete patient journey. No ranking or AI-citation predictions.
                    </p>
                  </div>
                </div>
                <details className="limitations">
                  <summary>
                    Full limitations & audit metadata
                    <ChevronDown size={14} />
                  </summary>
                  <ul>
                    {report.limitations.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                  <p>
                    Audit ID: {report.id} · {report.auditedAt} · Schema {report.schemaVersion} ·
                    Rubric {report.rubricVersion}
                  </p>
                </details>
              </section>
            </>
          )}
          <footer className="page-footer">
            <span>
              <span className="footer-brand">Page Quality Auditor</span>Evidence-led page reviews.
            </span>
            <button onClick={() => go('methodology')}>
              Evidence first. Always.
              <ArrowUpRight size={12} />
            </button>
          </footer>
        </main>
      </div>
      <section className="print-report">
        <h1>Page Quality Audit Report · Healthcare profile</h1>
        <p>
          {report.mode.toUpperCase()} · {report.auditedAt} · {report.rubricVersion}
        </p>
        <h2>{report.page.title}</h2>
        <p>{report.page.finalUrl}</p>
        <p>
          Implementation score: {report.score.value ?? 'Insufficient evidence'}/100. Coverage:{' '}
          {report.score.coverage}%. Only deterministic checks affect this score.
        </p>
        {report.findings.map((f) => (
          <article key={f.id}>
            <h3>{f.title}</h3>
            <p>
              {stateLabels[f.state]} · {methodLabels[f.method]} · {f.priority} priority
            </p>
            <p>
              <strong>Evidence:</strong> {f.evidence.selector} — {f.evidence.observation}
            </p>
            <p>
              <strong>Meaning:</strong> {f.why}
            </p>
            <p>
              <strong>Next step:</strong> {f.recommendation}
            </p>
          </article>
        ))}
        <h2>Limitations</h2>
        <ul>
          {report.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Methodology() {
  return (
    <section className="methodology">
      <div className="methodology-banner">
        <span className="category-icon trust">
          <ShieldCheck size={23} />
        </span>
        <div>
          <span className="eyebrow">TRANSPARENT BY DESIGN · HPQA-1.0.0</span>
          <h2>A useful diagnostic starts with honest boundaries.</h2>
          <p>
            Page Quality Auditor examines one page’s HTML and turns observations into a reviewable
            worklist. It cannot verify the quality of medical care or medical claims.
          </p>
        </div>
      </div>
      <div className="method-cards">
        <article>
          <span className="method-number">01</span>
          <h3>Observe the implementation</h3>
          <p>
            14 deterministic checks use explicit rules: HTTPS, title, description, H1, canonical,
            HTML noindex, language, viewport, JSON-LD syntax, section headings, alt attributes,
            button labels, field labels and link labels.
          </p>
          <p>
            Every result records its selector, observation and practical limitation. Passing a
            markup check does not prove a good user experience.
          </p>
        </article>
        <article>
          <span className="method-number">02</span>
          <h3>Surface signals for review</h3>
          <p>
            Author, reviewer, date, source links, editorial policy, publisher identity, introductory
            answer and action links are heuristic candidates. Patterns may miss content or match
            unrelated text.
          </p>
          <p>
            All eight remain “Human review” even when a signal is detected. They never contribute to
            the score.
          </p>
        </article>
        <article>
          <span className="method-number">03</span>
          <h3>Keep human judgment human</h3>
          <p>
            Two manual checks cover medical accuracy and the rendered patient journey. A qualified
            person must assess claims, credentials, accessibility and booking flows.
          </p>
          <p>
            No linked page is fetched, no form is submitted, and no source-page script is executed.
            No AI model or database is involved.
          </p>
        </article>
      </div>
      <div className="method-detail">
        <h3>How the score works</h3>
        <p>
          <code>Score = passed deterministic checks ÷ evaluated deterministic checks × 100</code>
        </p>
        <p>
          Every eligible check has equal weight. Pass = 1; fail = 0. Unknown checks are excluded
          from the denominator and reduce coverage. Coverage is evaluated checks divided by 14
          eligible checks. Below 80% coverage, the score is withheld. JSON-LD absence is unknown
          because structured data is optional. No other unknown state is currently emitted after a
          successful parse.
        </p>
        <p>
          Priority is a fixed editorial rule: HTTPS, HTML noindex and missing field labels are high;
          description, language, section headings and link labels are low; other implementation
          checks are medium. Clinical accountability, authorship, sources and medical accuracy are
          high-priority reviews. Effort labels estimate the type of work, not measured time. Context
          can change the priority.
        </p>
        <p>
          Single H1, self-canonical and section headings are project conventions with applicability
          caveats. Confirm publisher intent before “fixing” them.
        </p>
      </div>
      <div className="method-detail">
        <h3>Privacy & demo scope</h3>
        <p>
          This GitHub Pages app displays an audit of a fictional healthcare HTML fixture. It does
          not accept URLs, fetch websites, execute source-page scripts or send page data to an AI
          service. The same analysis rules generate the sample during the static build.
        </p>
        <p>
          Filters, sample reset and exports work in your browser. Reports stay in tab memory until
          reload; downloads are saved on your device. There is no application server, account
          system, database, analytics or report storage. GitHub controls its own hosting access
          logs.
        </p>
        <p>
          The sample demonstrates an evidence-led review workflow. It does not verify a real
          provider’s clinical accuracy, credentials, accessibility, search performance or conversion
          results.
        </p>
      </div>
      <div className="method-detail references">
        <h3>Read the source guidance</h3>
        <p>
          This is an independent portfolio project. The rubric is not endorsed by Google and does
          not reproduce a search quality rating.
        </p>
        <a
          href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content"
          target="_blank"
          rel="noreferrer"
        >
          Google: helpful, reliable, people-first content
          <ExternalLink size={14} />
        </a>
        <a
          href="https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data"
          target="_blank"
          rel="noreferrer"
        >
          Google: understand structured data
          <ExternalLink size={14} />
        </a>
        <a href="https://www.w3.org/WAI/tutorials/forms/labels/" target="_blank" rel="noreferrer">
          W3C: labeling form controls
          <ExternalLink size={14} />
        </a>
      </div>
    </section>
  );
}
