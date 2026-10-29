# Rubric hpqa-1.0.0

Report schema: 1.0. Rules are project conventions, not a search-engine rating system. Findings preserve category, method, state, evidence, reason, recommendation, priority and effort. The report carries timestamp, requested/final URL, mode, redirect count, bytes, robots result and the rubric version. Analysis is static, English-oriented, single-page and unauthenticated.

## Implementation score

Only the following 14 deterministic checks are eligible. Pass earns 1; fail earns 0. Unknown is excluded from evaluated weight and reduces coverage. All eligible weights are 1.

`coverage = evaluated / 14 × 100`

`score = round(passes / evaluated × 100)`, only when coverage ≥80%; otherwise null/“insufficient evidence.”

The static app analyses a supplied fictional HTML fixture at build time. It performs no network acquisition. JSON-LD absence is the only unknown state emitted by the current parser; coverage withholding is also tested directly for future partial-analysis cases. Empty groups of image/form/control elements pass the precisely labelled absence-of-missing-markup check, with a count of zero in evidence; they do not claim that an interaction was tested.

| ID            | Category  | Pass rule                                      | Key caveat                                                  | Priority if failed |
| ------------- | --------- | ---------------------------------------------- | ----------------------------------------------------------- | ------------------ |
| https         | Technical | Final URL uses HTTPS                           | Not a site security audit                                   | High               |
| title         | Technical | First non-SVG title has non-empty text         | Relevance and uniqueness not checked                        | Medium             |
| description   | Technical | First meta description is non-empty            | Google may rewrite snippets                                 | Low                |
| h1            | Technical | Exactly one H1 with non-empty text             | Editorial convention, not Google requirement                | Medium             |
| canonical     | Technical | One canonical resolves exactly to final URL    | Alternate canonical/duplicates may be intentional           | Medium             |
| html-robots   | Technical | No noindex/none in robots/googlebot meta       | No X-Robots-Tag or actual indexing check                    | High               |
| language      | Technical | lang matches simple language-tag syntax        | Not complete BCP 47 validation or actual language detection | Low                |
| viewport      | Technical | viewport includes width=device-width           | No rendered mobile check                                    | Medium             |
| jsonld        | AEO       | All supplied JSON-LD blocks parse              | Missing = unknown; no schema/eligibility validation         | Medium             |
| subheadings   | AEO       | At least one non-empty H2                      | Short pages may not need one                                | Low                |
| image-alt     | CRO       | Every img has alt attribute                    | Empty alt allowed; quality needs review                     | Medium             |
| button-labels | CRO       | Supported buttons have text/label/value markup | Static name proxy, not accessibility conformance            | Medium             |
| field-labels  | CRO       | Eligible fields have label or ARIA association | Placeholder alone fails; full accessible names not computed | High               |
| link-labels   | CRO       | Anchors have text/label/image-alt/title markup | Does not evaluate descriptiveness or destinations           | Low                |

Most remediation effort labels are “Quick fix.” JSON-LD is “Moderate.” These labels classify typical work, not measured hours. Check titles name the exact observation so a pass is not confused with a broader quality judgment.

## Heuristic signals: always human review, never scored

| ID               | Category | Evidence candidate                                                              | Priority |
| ---------------- | -------- | ------------------------------------------------------------------------------- | -------- |
| author           | Trust    | rel=author, itemprop=author, author/byline class, supported JSON-LD author.name | High     |
| reviewer         | Trust    | Clinical review phrase in body text                                             | High     |
| review-date      | Trust    | time datetime or article:modified_time                                          | Medium   |
| citations        | Trust    | Reference/source/evidence/study/pubmed/guideline link keywords                  | High     |
| editorial-policy | Trust    | Editorial/policy link text or URL                                               | Medium   |
| publisher        | Trust    | About/contact/tel/mailto link candidates                                        | Medium   |
| answer           | AEO      | First paragraph in main/article                                                 | Medium   |
| cta              | CRO      | Booking/appointment/contact/enquiry/consultation link text                      | Medium   |

Matching markup is a candidate, not verified authorship, reputation, expertise, review, fresh content, quality evidence, working contact, answer usefulness, or effective conversion design. Absence means “not detected by these patterns,” not “the site lacks it.” Informational pages may appropriately have no booking CTA.

## Manual checks: always human review, never scored

- `clinical-accuracy` (Trust, High): qualified review of accuracy, balance, risks, alternatives and relevant urgent-care guidance.
- `journey` (CRO, Medium): rendered accessibility, performance, mobile layout and full patient journey.

Review queue sorts high → medium → low; at equal priority implementation failures precede review items. Category summaries show counts of passed facts and review work rather than fabricated category trust scores.

## Sources and interpretation

Google’s [people-first guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) informs the review prompts. Its discussion of E-E-A-T does not make these signals a public ranking formula. [Structured data documentation](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) informs the distinction between parseable data and search eligibility. [W3C form guidance](https://www.w3.org/WAI/tutorials/forms/labels/) informs static label checks. The exact rules, priorities and equal-weight arithmetic are this project’s independent design choices.

Changes to check meaning, applicability or scoring require a new rubric version and fixture expectations. Application styling changes alone do not change the rubric.
