# NanJu Wu — AI-guided portfolio

An independently implemented English academic and technical portfolio. This is Version 2 of a coursework comparison: the owner specified the information architecture, content boundaries, brand, visual direction, interactions, and isolation requirements; AI implemented the specification.

**Website:** https://nanju-intelligencelab.github.io/personal-portfolio-v2-guided/me-designed-page.html

## Local preview and checks

Requires Node.js 24 or later. There is no framework, runtime dependency, or build step.

```sh
npm ci --ignore-scripts
npx playwright install chromium
npm run dev
```

Open http://127.0.0.1:4273/personal-portfolio-v2-guided/me-designed-page.html.

```sh
npm run check
npm test
npm run capture
```

Browser and accessibility tooling is used only for development. Screenshots are generated into the ignored `.artifacts/screenshots/` directory; capture does not approve them for publication. `SITE_URL` selects an alternate base URL for online browser checks and captures.

## Public source and deployment

The public repository contains implementation, configuration, and tests. Development records require owner approval and screenshots require review before they can be included. Original factual source documents, local integrity manifests, machine-specific paths and environment records, dependencies, caches, and unreviewed screenshots are never committed. The public-file check enforces an explicit allowlist; development records and screenshots are excluded until separately approved.

GitHub Pages publishes **only `site/`**, not the repository root. PRs and pushes to `main` run validation without deployment. A manual workflow on `main` validates first and deploys only after success. Manual workflows on other branches validate without deploying. The deployment uses its own repository and Pages environment.

The original Version 1 is maintained separately and remains frozen. Its code, history, and deployment are not part of this repository. Local isolation verification reads protected files without running Git against Version 1 and writes manifests only into the ignored `.artifacts/integrity/` directory.

## Content boundaries

Personal information is derived from the owner's supplied factual profile. Project measurements are reported source figures, not independent benchmarks. Simulation results are identified as such. AI interests and future projects are distinguished from completed work. No skill ratings, CV downloads, unverified project links, or excluded academic records are published.

The supplied NJ SVG geometry is preserved. The header uses the primary mark; the browser icon uses the dedicated tile variant. No remote fonts, stock images, analytics, or backend services are loaded.
