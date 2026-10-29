import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { load } from 'cheerio';
const { basePath } = JSON.parse(await readFile('out/build-info.json', 'utf8'));
const html = await readFile('out/index.html', 'utf8');
const $ = load(html);
assert.equal($('title').first().text(), 'Page Quality Auditor');
assert.ok($('.deployment-note').text().includes('No websites are fetched'));
assert.ok($('.sample-url').text().includes('northstar-health.example'));
assert.equal($('form').length, 0);
assert.equal($('input[type="url"]').length, 0);
assert.equal($('.brand').attr('href'), `${basePath}/`);
assert.equal($('.finding').length, 24);
await access('out/.nojekyll');
await assert.rejects(access('out/api'));
const assets = $('script[src],link[rel="stylesheet"],link[rel="icon"]')
  .toArray()
  .map((el) => $(el).attr(el.tagName === 'script' ? 'src' : 'href'))
  .filter(Boolean);
assert.ok(assets.length > 0);
for (const url of assets) {
  assert.ok(url.startsWith(`${basePath}/`), `Asset lost the repository base path: ${url}`);
  const file = decodeURIComponent(url.slice(basePath.length).split('?')[0]);
  await access(`out${file}`);
}
console.log(
  `Static export verified: 24 findings, fixture-only demo, no URL form or API route, ${assets.length} working asset paths at ${basePath || '/'}.`,
);

const readme = await readFile('README.md', 'utf8');
const screenshots = [...readme.matchAll(/!\[[^\]]*\]\((docs\/screenshots\/[^)]+)\)/g)].map(
  (match) => match[1],
);
assert.equal(new Set(screenshots).size, 6, 'README must embed six distinct screenshots');
for (const screenshot of screenshots) await access(screenshot);
console.log('README verified: six embedded screenshots, all image paths resolve.');
