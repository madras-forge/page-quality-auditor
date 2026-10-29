# Verification record — GitHub Pages-only edition

Verified locally on 29 October 2026 using Node 24.18.0, Next.js 16.4.3, React 19.3.1 and TypeScript 7.0.2. The package is a static interactive demo. The former Node acquisition/API implementation, server tests, Docker setup and server instructions were removed at the user’s request.

## Automated checks

- **8 analysis/export tests pass.** Fixtures cover the 24 demo findings, exact score, non-SVG titles, detected-author versus verified-expertise distinction, HTML noindex, optional/invalid JSON-LD, static labels, canonical resolution, coverage withholding and safe Markdown export.
- Type check passes with fresh route types (`next typegen && tsc --noEmit`).
- The production build contains only static pages and the icon; no API route is exported.
- Root and `/page-quality-auditor` project-path builds pass output verification. Checks cover metadata, the fictional sample URL, absence of URL inputs/forms/API output, 24 findings, `.nojekyll`, the home link and all 9 generated asset paths.
- README verification checks six distinct embedded screenshots and confirms that every image path exists.
- Formatting is checked with Prettier. Dependency versions are pinned in the lockfile.

## Browser verification

Served only the exported files from a temporary local static preview at `/page-quality-auditor/`, matching GitHub project-site hosting. No application backend was running.

- Overview, method/category/status controls and evidence panels render.
- Conversion UX + Needs attention produces the two relevant findings. Expanded field-label evidence shows one eligible field without associated label markup and a specific next step.
- The action plan and methodology navigate correctly.
- Reset demo restores the fictional report and filters and announces completion without calling an API.
- JSON download succeeded; the downloaded report contains all 24 findings even when the interface is filtered.
- Browser console inspection returned no captured errors or warnings during the checked workflow.
- Desktop (1440px) and mobile (390px) layouts were inspected; the mobile document width equals its viewport width.

## README screenshot gallery

All images are real captures of the current app. Crops frame the relevant interface; content was not recreated or composited.

1. `01-overview.jpg` — score, scope, next step and category summary.
2. `02-evidence.jpg` — filtered findings with expanded evidence/remediation.
3. `03-action-plan.jpg` — prioritised implementation fixes and human reviews.
4. `04-methodology.jpg` — check methods, scoring and limitations.
5. `05-exports.jpg` — JSON, Markdown and print options.
6. `06-mobile.jpg` — responsive overview and category cards.

## Verification limits

This is not a full WCAG audit or a clinical/SEO assessment of a real provider. Screen readers, additional browsers/devices, quantitative user testing and complete print-to-PDF pagination remain unverified. The scoring number does not establish medical quality, rankings, AI citations or conversion uplift.

The GitHub Actions workflow has not been run in the user’s account and no live github.io deployment is claimed. Local build and repository-path checks verify the package’s compatibility; publishing requires the repository’s Pages source to be set to GitHub Actions.
