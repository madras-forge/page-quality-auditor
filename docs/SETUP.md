# Development and deployment

Maintainer instructions for running, checking and deploying Page Quality Auditor.

## Publish on GitHub.io

1. Create a GitHub repository, for example `page-quality-auditor`.
2. Upload **the contents of this folder** to the repository root, including the hidden `.github` folder, `package.json`, `package-lock.json` and `docs/screenshots`. Do not upload the containing folder, `node_modules`, `.next` or `out`.
3. Open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Push to `main`, or open **Actions → Deploy GitHub Pages demo → Run workflow**. If your default branch has a different name, change the workflow’s branch setting.
5. Open the site URL shown in the completed deployment job.

The workflow tests, builds, verifies and publishes the static `out/` directory. It detects the correct path for both `username.github.io` and `username.github.io/repository-name/`, including configured custom domains. It uses GitHub’s built-in token. No personal access token is required; normal GitHub Pages availability and repository permissions apply.

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
