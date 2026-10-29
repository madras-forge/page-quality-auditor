import * as cheerio from 'cheerio';
import { randomUUID } from 'node:crypto';
import type { AuditReport, Finding, PageSource } from './types';

const compact = (value: string, max = 360) => value.replace(/\s+/g, ' ').trim().slice(0, max);
export function scoreFindings(findings: Finding[]): AuditReport['score'] {
  const eligible = findings.filter((f) => f.method === 'deterministic');
  const evaluated = eligible.filter((f) => f.state === 'pass' || f.state === 'fail');
  const passed = evaluated.filter((f) => f.state === 'pass').length;
  const coverage = eligible.length ? Math.round((evaluated.length / eligible.length) * 100) : 0;
  return {
    value:
      coverage >= 80 && evaluated.length ? Math.round((passed / evaluated.length) * 100) : null,
    passed,
    evaluated: evaluated.length,
    total: eligible.length,
    coverage,
  };
}

export function analyzePage(
  source: PageSource,
  mode: 'live' | 'demo' = 'live',
  now = new Date(),
): AuditReport {
  const $ = cheerio.load(source.html);
  $('script:not([type="application/ld+json"]),style,noscript,template').remove();
  const text = compact($('body').text(), 100_000);
  const title = compact(
    $('title')
      .filter((_, el) => $(el).parents('svg').length === 0)
      .first()
      .text(),
    240,
  );
  const description = compact($('meta[name="description" i]').attr('content') ?? '');
  const language = $('html').attr('lang') ?? '';
  const findings: Finding[] = [];
  const add = (finding: Finding) => findings.push(finding);
  const fact = (
    id: string,
    category: Finding['category'],
    name: string,
    pass: boolean,
    selector: string,
    observation: string,
    recommendation: string,
    why: string,
    priority: Finding['priority'] = 'medium',
  ) =>
    add({
      id,
      category,
      title: name,
      method: 'deterministic',
      state: pass ? 'pass' : 'fail',
      priority,
      effort: 'Quick fix',
      evidence: { selector, observation: compact(observation) },
      recommendation,
      why,
    });
  const review = (
    id: string,
    category: Finding['category'],
    name: string,
    selector: string,
    observation: string,
    recommendation: string,
    why: string,
    priority: Finding['priority'] = 'medium',
    method: 'heuristic' | 'manual' = 'heuristic',
  ) =>
    add({
      id,
      category,
      title: name,
      method,
      state: 'review',
      priority,
      effort: 'Editorial review',
      evidence: { selector, observation: compact(observation) },
      recommendation,
      why,
    });

  fact(
    'https',
    'technical',
    'Secure page connection',
    source.finalUrl.startsWith('https:'),
    'response URL',
    source.finalUrl,
    'Serve this page over HTTPS and redirect HTTP visitors to it.',
    'HTTPS protects data in transit. This does not assess the security of the entire website.',
    'high',
  );
  fact(
    'title',
    'technical',
    'Page title present',
    !!title,
    'title (excluding SVG titles)',
    title || 'No non-empty title found.',
    'Add a concise, unique title that describes this page and its purpose.',
    'A title helps people and search engines distinguish the page. Presence alone does not establish relevance.',
  );
  fact(
    'description',
    'technical',
    'Meta description present',
    !!description,
    'meta[name="description"]',
    description || 'No non-empty description found.',
    'Write a page-specific summary of the content and next step.',
    'Search engines may use a description for a snippet; they may also choose other text.',
    'low',
  );
  const h1s = $('h1')
    .toArray()
    .map((el) => compact($(el).text()));
  fact(
    'h1',
    'technical',
    'One non-empty main heading',
    h1s.length === 1 && !!h1s[0],
    'h1',
    `${h1s.length} H1 element(s). ${h1s.join(' | ')}`,
    'Use one clear main heading as this project’s editorial convention; verify the page hierarchy.',
    'A single H1 is a useful publishing convention, not a Google requirement or ranking guarantee.',
  );
  const canonicals = $('link[rel~="canonical" i]');
  const canonical = canonicals.first().attr('href') ?? '';
  let selfCanonical = false;
  try {
    const target = new URL(canonical, source.finalUrl);
    selfCanonical = !!canonical && target.href === new URL(source.finalUrl).href;
  } catch {
    /* invalid href */
  }
  fact(
    'canonical',
    'technical',
    'Self-referencing canonical',
    canonicals.length === 1 && selfCanonical,
    'link[rel~="canonical"]',
    `${canonicals.length} canonical element(s). ${canonical || 'No canonical href found.'}`,
    'For an original indexable page, add one canonical pointing to its preferred URL. Confirm intentional duplicates before changing an alternate canonical.',
    'This check assumes an original page. An alternate canonical may be intentional; Google may choose a different canonical.',
  );
  const robots = $('meta[name="robots" i],meta[name="googlebot" i]')
    .toArray()
    .map((el) => $(el).attr('content') ?? '')
    .join(', ');
  fact(
    'html-robots',
    'technical',
    'No HTML noindex directive',
    !/(?:^|[\s,])(noindex|none)(?:$|[\s,])/i.test(robots),
    'meta[name="robots"],meta[name="googlebot"]',
    robots || 'No robots meta directives observed.',
    'If this page should appear in search, remove the noindex directive after confirming publisher intent.',
    'Checks HTML directives only. X-Robots-Tag headers, Google indexing, and crawl history are not assessed.',
    'high',
  );
  fact(
    'language',
    'technical',
    'Document language declared',
    /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(language),
    'html[lang]',
    language || 'No language attribute found.',
    'Set the HTML lang attribute to the primary language, for example en-GB.',
    'A declared language supports assistive technologies. Actual language accuracy needs review.',
    'low',
  );
  const viewport = $('meta[name="viewport" i]').attr('content') ?? '';
  fact(
    'viewport',
    'technical',
    'Responsive viewport declared',
    /width\s*=\s*device-width/i.test(viewport),
    'meta[name="viewport"]',
    viewport || 'No viewport meta element found.',
    'Declare width=device-width, initial-scale=1 and verify the rendered page on mobile.',
    'This detects the declaration only; no responsive rendering or zoom audit is performed.',
  );

  const ldScripts = $('script[type="application/ld+json"]');
  let invalidJson = 0;
  const types = new Set<string>();
  const authors: string[] = [];
  let nodes = 0;
  function walk(value: unknown, depth = 0) {
    if (!value || typeof value !== 'object' || depth > 20 || ++nodes > 5000) return;
    if (Array.isArray(value)) {
      value.forEach((item) => walk(item, depth + 1));
      return;
    }
    const obj = value as Record<string, unknown>;
    for (const t of [obj['@type']].flat()) if (typeof t === 'string') types.add(compact(t, 60));
    if (
      obj.author &&
      typeof obj.author === 'object' &&
      'name' in obj.author &&
      typeof obj.author.name === 'string'
    )
      authors.push(compact(obj.author.name));
    Object.values(obj).forEach((item) => walk(item, depth + 1));
  }
  ldScripts.each((_, el) => {
    try {
      walk(JSON.parse($(el).text()));
    } catch {
      invalidJson++;
    }
  });
  add({
    id: 'jsonld',
    category: 'aeo',
    title: 'JSON-LD syntax when supplied',
    method: 'deterministic',
    state: ldScripts.length ? (invalidJson ? 'fail' : 'pass') : 'unknown',
    priority: 'medium',
    effort: 'Moderate',
    evidence: {
      selector: 'script[type="application/ld+json"]',
      observation: `${ldScripts.length} block(s); ${invalidJson} parse error(s). Types observed: ${[...types].join(', ') || 'none'}.`,
    },
    why: 'Valid JSON syntax does not validate schema semantics, eligibility, or AI citation. Structured data is optional.',
    recommendation:
      'Fix JSON parse errors if present. If adding schema, choose a supported type that accurately reflects visible content and validate it separately.',
  });
  const h2s = $('h2')
    .toArray()
    .map((el) => compact($(el).text()))
    .filter(Boolean);
  fact(
    'subheadings',
    'aeo',
    'Content has section headings',
    h2s.length > 0,
    'h2',
    `${h2s.length} non-empty H2 element(s). ${h2s.slice(0, 5).join(' | ')}`,
    'Break substantial content into useful, descriptive sections when appropriate.',
    'Section headings help navigation and extraction. A short page may not need multiple sections.',
    'low',
  );

  const images = $('img');
  const noAlt = images.toArray().filter((el) => $(el).attr('alt') === undefined);
  fact(
    'image-alt',
    'cro',
    'Images have alt attributes',
    noAlt.length === 0,
    'img:not([alt])',
    `${images.length} image(s); ${noAlt.length} without an alt attribute. Empty alt is allowed for decorative images.`,
    'Add meaningful alternative text to informative images; use alt="" for decorative images.',
    'Presence is a static proxy. Alternative-text quality and decorative intent need a person’s review.',
  );
  function textOrLabel(el: Parameters<typeof $>[0]): string {
    const node = $(el);
    const referenced = (node.attr('aria-labelledby') ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .map((id) =>
        $('[id]')
          .filter((_, item) => $(item).attr('id') === id)
          .text(),
      )
      .join(' ');
    return compact(
      node.attr('aria-label') ||
        referenced ||
        node.text() ||
        node.find('img[alt]').attr('alt') ||
        node.attr('title') ||
        '',
    );
  }
  const buttons = $('button,input[type="button"],input[type="submit"]');
  const emptyButtons = buttons
    .toArray()
    .filter((el) => !textOrLabel(el) && !$(el).attr('value') && $(el).attr('type') !== 'submit');
  fact(
    'button-labels',
    'cro',
    'Buttons have text or label markup',
    emptyButtons.length === 0,
    'button,input[type="button"],input[type="submit"]',
    `${buttons.length} button(s); ${emptyButtons.length} without detected text or label markup. Native submit inputs have a browser default label.`,
    'Give each button a concise visible label or suitable accessible-name markup.',
    'This static proxy is not the full accessible-name computation or a visibility check.',
  );
  const fields = $(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]),select,textarea',
  );
  const unlabeled = fields.toArray().filter((el) => {
    const node = $(el);
    const id = node.attr('id');
    return !(
      node.attr('aria-label')?.trim() ||
      (node.attr('aria-labelledby') ?? '').split(/\s+/).some(
        (ref) =>
          ref &&
          $('[id]')
            .filter((_, item) => $(item).attr('id') === ref)
            .text()
            .trim(),
      ) ||
      node.closest('label').text().trim() ||
      (id &&
        $('label[for]')
          .toArray()
          .some((label) => $(label).attr('for') === id && $(label).text().trim()))
    );
  });
  fact(
    'field-labels',
    'cro',
    'Form fields have label markup',
    unlabeled.length === 0,
    'input,select,textarea',
    `${fields.length} eligible field(s); ${unlabeled.length} without associated label markup.`,
    'Associate a clear label with every field. Do not rely on a placeholder as the only label.',
    'Static association check only; this audit never submits forms.',
    'high',
  );
  const links = $('a[href]');
  const emptyLinks = links.toArray().filter((el) => !textOrLabel(el));
  fact(
    'link-labels',
    'cro',
    'Links have text or label markup',
    emptyLinks.length === 0,
    'a[href]',
    `${links.length} link(s); ${emptyLinks.length} without detected text or label markup.`,
    'Provide text that makes each link’s destination or purpose understandable.',
    'This does not evaluate whether links work or whether their text is sufficiently descriptive.',
    'low',
  );

  const byline =
    compact(
      $('[rel="author"],[itemprop="author"],[class*="byline"],[class*="author"]').first().text(),
    ) || authors[0];
  review(
    'author',
    'trust',
    'Named author & relevant expertise',
    '[rel="author"],[itemprop="author"],byline,JSON-LD author',
    byline
      ? `Candidate author signal: ${byline}`
      : 'No author candidate found by the supported selectors. Other patterns may exist.',
    'Confirm a named author, linked biography, and expertise relevant to this page’s claims. Verify credentials with appropriate independent sources.',
    'Author markup can be detected, but identity, expertise and reputation cannot be verified from its presence.',
    'high',
  );
  const reviewer = /(?:medically reviewed|clinical(?:ly)? reviewed|reviewed by)[^.!?]{0,160}/i.exec(
    text,
  )?.[0];
  review(
    'reviewer',
    'trust',
    'Clinical review & accountability',
    'body text: review phrase',
    reviewer || 'No clinical-review phrase detected in the fetched HTML.',
    'For clinical claims, check whether an appropriately qualified reviewer and review process are visible and verifiable. Confirm applicability for this page type.',
    'Healthcare content needs editorial judgment; absence from the HTML is not proof that no review happened.',
    'high',
  );
  const date =
    $('time[datetime]').first().attr('datetime') ||
    $('meta[property="article:modified_time"]').attr('content');
  review(
    'review-date',
    'trust',
    'Review date & maintenance',
    'time[datetime],meta[property="article:modified_time"]',
    date ? `Candidate date: ${date}` : 'No supported machine-readable date found.',
    'Confirm an accurate published/reviewed date and a suitable clinical review schedule. Do not refresh dates without reviewing content.',
    'A date may describe publication, modification, or another event; recency alone does not prove accuracy.',
  );
  const citation = links
    .toArray()
    .filter((el) =>
      /reference|source|evidence|study|pubmed|guideline/i.test(
        `${$(el).text()} ${$(el).attr('href')}`,
      ),
    );
  review(
    'citations',
    'trust',
    'Clinical claims have supporting sources',
    'a[href]: source/reference candidates',
    citation.length
      ? `${citation.length} candidate source link(s): ${citation
          .slice(0, 2)
          .map((el) => compact($(el).text(), 100))
          .join(' | ')}`
      : 'No source links detected by the keyword heuristic.',
    'Trace consequential claims to relevant, current primary evidence or clinical guidelines. Check that citations support the specific statements.',
    'Link keywords do not establish evidence quality, accuracy, or clinical consensus.',
    'high',
  );
  const policy = links
    .toArray()
    .filter((el) =>
      /editorial|medical review|content policy/i.test(`${$(el).text()} ${$(el).attr('href')}`),
    );
  review(
    'editorial-policy',
    'trust',
    'Transparent editorial process',
    'a[href]: editorial policy candidates',
    policy.length
      ? `Candidate link: ${compact($(policy[0]).text())}`
      : 'No editorial policy link detected.',
    'Check that editorial standards, review responsibilities, corrections, and conflicts of interest are explained where appropriate.',
    'The target policy is not fetched or verified.',
  );
  const contact = links
    .toArray()
    .filter((el) => /contact|about us|tel:|mailto:/i.test(`${$(el).text()} ${$(el).attr('href')}`));
  review(
    'publisher',
    'trust',
    'Publisher identity & contact route',
    'a[href]: contact/about candidates',
    contact.length
      ? `${contact.length} candidate contact/about link(s).`
      : 'No contact/about link detected.',
    'Verify the organisation’s identity, accountable ownership and a working contact route; check regulator information when relevant.',
    'Contact markup does not verify a provider’s legitimacy or regulatory status.',
  );
  const answer = $('main p,article p').first().text();
  review(
    'answer',
    'aeo',
    'Clear answer near the start',
    'main p:first,article p:first',
    answer ? compact(answer) : 'No introductory paragraph found inside main or article.',
    'Check whether the opening directly addresses the user’s likely question, then explains scope, risks, alternatives, and appropriate next steps.',
    'Answer usefulness and medical completeness need editorial review. This does not predict AI inclusion.',
  );
  const cta = links
    .toArray()
    .filter((el) => /book|appointment|contact|enquir|consultation/i.test($(el).text()));
  review(
    'cta',
    'cro',
    'A clear, appropriate next step',
    'a[href]: booking/contact text candidates',
    cta.length
      ? `${cta.length} candidate action link(s): ${compact($(cta[0]).text())}`
      : 'No booking/contact link detected by the text heuristic.',
    'Verify a clear, low-pressure next step that matches page intent, with costs and expectations explained when relevant. Test it on mobile.',
    'This cannot establish visual prominence, working booking flows, conversion rates or suitability for a patient.',
  );
  review(
    'clinical-accuracy',
    'trust',
    'Medical accuracy & balanced advice',
    'Not assessable from static markup',
    'Requires a qualified human reviewer. This audit has not evaluated medical claims.',
    'Have a qualified reviewer assess accuracy, benefits, risks, alternatives, urgent-care guidance where relevant, and conflicts of interest.',
    'No automated page audit can establish medical accuracy from markup signals.',
    'high',
    'manual',
  );
  review(
    'journey',
    'cro',
    'Rendered accessibility & patient journey',
    'Rendered page and interactions: not tested',
    'No JavaScript, layout, contrast, keyboard navigation, Core Web Vitals or form flow was tested.',
    'Test keyboard and screen-reader use, contrast, responsive layout, consent patterns, errors and the complete booking journey without submitting real patient data.',
    'Static HTML cannot demonstrate rendered accessibility or conversion performance.',
    'medium',
    'manual',
  );

  const { html: _html, ...page } = source;
  return {
    schemaVersion: '1.0',
    rubricVersion: 'hpqa-1.0.0',
    id: randomUUID(),
    mode,
    auditedAt: now.toISOString(),
    page: { ...page, title, description, language, wordCount: text ? text.split(/\s+/).length : 0 },
    findings,
    score: scoreFindings(findings),
    limitations: [
      'One fetched HTML page only. Linked biographies, citations, policies, assets and booking destinations were not fetched.',
      'No JavaScript rendering, mobile layout, accessibility conformance, Core Web Vitals, search indexing or X-Robots-Tag header assessment.',
      'Heuristic signals may miss valid implementations or match unrelated text. They always require human review and never affect the score.',
      'The implementation score is an equal-weight project rubric, not a Google E-E-A-T score, clinical-quality rating, ranking prediction or AI-citation guarantee.',
      ...(mode === 'demo'
        ? ['Synthetic fixture for demonstration. No real provider was audited.']
        : []),
    ],
  };
}
