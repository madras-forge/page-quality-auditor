import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const basePath = process.env.PAGES_BASE_PATH ?? '';
if (basePath && !/^\/[a-zA-Z0-9._-]+$/.test(basePath)) {
  throw new Error(
    'PAGES_BASE_PATH must be empty or a single repository path such as /page-quality-auditor.',
  );
}
const build = spawnSync(process.execPath, [require.resolve('next/dist/bin/next'), 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_TELEMETRY_DISABLED: '1',
  },
});
if (build.status !== 0) process.exit(build.status ?? 1);
await writeFile('out/.nojekyll', '');
await writeFile('out/build-info.json', JSON.stringify({ mode: 'static-demo', basePath }, null, 2));
console.log('GitHub Pages demo exported to out/. No application server is required.');
