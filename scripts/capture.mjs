import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('../.artifacts/screenshots/', import.meta.url));
await mkdir(directory, { recursive: true });
const base = process.env.SITE_URL || 'http://127.0.0.1:4273/personal-portfolio-v2-guided/';
const browser = await chromium.launch();
try {
  for (const [name, width, height] of [['desktop', 1440, 1000], ['tablet', 768, 1024], ['mobile', 390, 844], ['narrow', 320, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(new URL('me-designed-page.html', base).href);
    await page.screenshot({ path: `${directory}${name}-opening.png` });
    await page.screenshot({ path: `${directory}${name}-full.png`, fullPage: true });
    await page.locator('#project-resnet').screenshot({ path: `${directory}${name}-research.png`, style: '.site-header { visibility: hidden; }' });
    await page.close();
  }
  console.log('Captured local-only screenshots; publication requires a separate review.');
} finally { await browser.close(); }
