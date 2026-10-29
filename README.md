# Page Quality Auditor

A polished, evidence-led audit dashboard for technical SEO, trust signals, answer readiness and conversion UX. Built with **Next.js, React and TypeScript** and designed to run entirely on **GitHub Pages**.

**This is an interactive sample audit, not a live URL scanner.** It uses a fictional healthcare page to demonstrate 24 checks, transparent evidence and prioritised recommendations. No application server, account, database, AI service or API key is required. Node is needed only for development and building the static files.

[Overview](#desktop-overview) · [Evidence](#findings-and-evidence) · [Action plan](#prioritised-action-plan) · [Methodology](#transparent-methodology) · [Exports](#report-exports) · [Mobile](#mobile-experience)

## Screenshots

Each screenshot below links to its full-size image and shows the actual application.

### Desktop overview

Implementation score, coverage, four audit perspectives and a clearly labelled fictional report.

[![Desktop dashboard overview](docs/screenshots/01-overview.jpg)](docs/screenshots/01-overview.jpg)

### Findings and evidence

Filter by category, method or status; open a finding to inspect its source observation, limitation and recommended fix.

[![Filtered findings with expanded evidence and recommendation](docs/screenshots/02-evidence.jpg)](docs/screenshots/02-evidence.jpg)

### Prioritised action plan

A review queue separates implementation gaps from the questions that need a person.

[![Prioritised action plan with an expanded recommendation](docs/screenshots/03-action-plan.jpg)](docs/screenshots/03-action-plan.jpg)

### Transparent methodology

Published scoring rules explain what was observed, what is inferred, and what cannot be automated.

[![Methodology and scoring explanation](docs/screenshots/04-methodology.jpg)](docs/screenshots/04-methodology.jpg)

### Report exports

Download the complete report as JSON or Markdown, or open the print view. Active filters do not remove findings from exports.

[![Report export options](docs/screenshots/05-exports.jpg)](docs/screenshots/05-exports.jpg)

### Mobile experience

Responsive navigation and a stacked report layout keep the same evidence available on smaller screens.

[![Mobile audit dashboard](docs/screenshots/06-mobile.jpg)](docs/screenshots/06-mobile.jpg)

## Publish on GitHub.io

1. Create a GitHub repository, for example `page-quality-auditor`.
2. Upload **the contents of this folder** to the repository root, including the hidden `.github` folder, `package.json`, `package-lock.json` and `docs/screenshots`. Do not upload the containing folder, `node_modules`, `.next` or `out`.
3. Open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Push to `main`, or open **Actions → Deploy GitHub Pages demo → Run workflow**. If your default branch has a different name, change the workflow’s branch setting.
5. Open the site URL shown in the completed deployment job.

The workflow tests, builds, verifies and publishes the static `out/` directory. It detects the correct path for both `username.github.io` and `username.github.io/repository-name/`, including configured custom domains. It uses GitHub’s built-in token. No personal access token is required; normal GitHub Pages availability and repository permissions apply.

This repository package has not been published to a GitHub account yet.

## Run locally

Use Node 24 (or Node 22.12+) and npm:

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:3000>. The local development preview is optional; the published site serves static files only.

## Build and check

```sh
npm test
npm run typecheck
npm run build
npm run verify:pages
```

To preview the export locally:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory out
```

Open <http://127.0.0.1:4173>. For a repository-path build, use `PAGES_BASE_PATH=/repository-name npm run build`; the resulting files expect that path. GitHub Actions supplies it automatically.

## What the demo includes

- **24 checks:** 14 deterministic, 8 heuristic signals, and 2 manual-review checks.
- Search and category/method/status filters, expandable evidence, an action plan and methodology.
- An implementation score based only on deterministic checks; unknown results reduce coverage.
- Browser-local sample reset, JSON/Markdown downloads and a full print layout.
- Responsive navigation, semantic labels, keyboard controls, focus indicators and reduced-motion support.
- A fictional healthcare profile. No real provider has been assessed or rated.

## Project structure

```text
app/                  React dashboard, styling and static page
lib/analyze.ts        Independent HTML checks and scoring
lib/demo.ts           Fictional source fixture, analysed during the build
lib/export.ts         Portable Markdown report
lib/types.ts          Report contract and category definitions
scripts/              Static build and output verification
tests/               Analysis, scoring and export regression fixtures
docs/screenshots/    Real screenshots embedded in this README
docs/RUBRIC.md       Exact rules and applicability caveats
docs/VALIDATION.md   Verification results and limits
.github/workflows/    Checks and GitHub Pages deployment
```

## Scope and limitations

The score describes markup implementation under this project’s rubric. It is not a Google E-E-A-T score, clinical-quality rating, ranking prediction or AI-citation guarantee. Credentials, clinical accuracy, source quality, rendered accessibility and conversion effectiveness require human review. Full WCAG conformance and complete print-to-PDF pagination have not been certified.

The app does not fetch websites, execute source-page scripts, submit forms, store reports or use analytics. Sample data stays in tab memory; exports are saved on the visitor’s device. GitHub manages its own hosting access logs.

[Read the rubric](docs/RUBRIC.md) · [See verification results](docs/VALIDATION.md)

Reference guidance: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports), [Google people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) and [W3C form labels](https://www.w3.org/WAI/tutorials/forms/labels/).
