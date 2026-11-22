import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

const entry = 'me-designed-page.html';

test('project-site root opens only the independent Version 2 entry', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/\/personal-portfolio-v2-guided\/me-designed-page\.html$/);
  await expect(page.locator('h1')).toHaveText('AI Application Development');
  await expect(page.locator('.identity')).toContainText('NanJu Wu');
  await expect(page.locator('.experiment-note')).toHaveText('Coursework experiment · Version 2: AI-guided development');
});

test('seven sections, skills and projects follow the human-specified order', async ({ page }) => {
  await page.goto(entry);
  expect(await page.locator('main > section').evaluateAll(nodes => nodes.map(node => node.id))).toEqual(['home', 'about', 'skills', 'projects', 'achievements', 'research', 'contact']);
  expect(await page.locator('.skill-group').evaluateAll(nodes => nodes.map(node => node.id))).toEqual(['skills-programming', 'skills-ai', 'skills-backend', 'skills-engineering']);
  await expect(page.locator('#skills-ai h3')).toHaveText('3.2 AI and Intelligent Applications');
  expect(await page.locator('.project-list > article').evaluateAll(nodes => nodes.map(node => node.id))).toEqual(['project-resnet', 'project-iot', 'project-simulation', 'project-future']);
  await expect(page.locator('#project-resnet h3')).toHaveText('4.1 ResNet Research Review');
});

test('public research, education, metrics and contact facts match the approved source', async ({ page }) => {
  await page.goto(entry);
  await expect(page.locator('.paper-title')).toHaveText('A Review of Research Progress on ResNet and Its Fusion Applications');
  await expect(page.locator('.paper-authors')).toHaveText('Nanju Wu, Dechao Sun / First author');
  await expect(page.locator('.conference')).toHaveText('2025 8th International Conference on Big Data and Artificial Intelligence (BDAI)');
  await expect(page.locator('.doi-link')).toHaveAttribute('href', 'https://doi.org/10.1109/BDAI66031.2025.11325235');
  await expect(page.locator('.education')).toContainText('MSc Electronic Communications and Computer Engineering');
  await expect(page.locator('.education')).toContainText('University of Nottingham Ningbo China');
  await expect(page.locator('.education')).toContainText('September 2026 onwards');
  await expect(page.locator('.iot-metrics dd')).toHaveText(['1,000', '952.4 msg/s', '45 ms', '82 ms', '120 ms']);
  await expect(page.locator('.simulation-metrics dd')).toHaveText(['0.35–0.44 s', '1.19–1.69 s', '<5%']);
  await expect(page.locator('#contact a').first()).toHaveAttribute('href', 'mailto:wunanju965@gmail.com');
  await expect(page.locator('#contact a').last()).toHaveAttribute('href', 'https://github.com/NanJu-IntelligenceLab');
});

test('interests, proposed work and evidence limits are explicit; excluded claims stay absent', async ({ page }) => {
  await page.goto(entry);
  await expect(page.locator('#skills-ai .interest-label')).toHaveText('Development interests');
  await expect(page.locator('#skills-ai .scope-note')).toContainText('rather than a list of completed implementations');
  await expect(page.locator('.future-status')).toHaveText('Not implemented');
  await expect(page.locator('.future-grid > div')).toHaveCount(3);
  await expect(page.locator('#project-iot .scope-note')).toContainText('not been independently benchmarked');
  await expect(page.locator('#project-simulation .scope-note')).toContainText('rather than field deployment measurements');
  await expect(page.locator('body')).not.toContainText(/proficiency|expert in|skill rating|undergraduate grades|academic ranking|citation count|download cv|python/i);
  expect(await page.locator('progress, meter, form, [download]').count()).toBe(0);
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`all content fits at ${width}px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(entry);
    const overflow = await page.evaluate(() => ({
      width: innerWidth,
      document: document.documentElement.scrollWidth,
      elements: [...document.querySelectorAll('main *, header *, footer *')].filter(node => {
        const box = node.getBoundingClientRect();
        return box.width > 0 && (box.left < -1 || box.right > innerWidth + 1);
      }).map(node => `${node.tagName}.${node.className}`)
    }));
    expect(overflow.document, JSON.stringify(overflow)).toBeLessThanOrEqual(width);
    expect(overflow.elements).toEqual([]);
    await expect(page.locator('.metrics')).toHaveCount(2);
    if (width < 1024) {
      await page.getByRole('button', { name: 'Menu' }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await expect(page.getByRole('navigation').getByRole('link', { name: 'Research' })).toBeVisible();
    } else {
      await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden();
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });
}

test('mobile menu supports keyboard, Escape, navigation and focus transfer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(entry);
  const menu = page.locator('.menu-toggle');
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Home', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.getByRole('navigation').getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#projects')).toBeFocused();
  expect(await page.locator('#projects').evaluate(node => node.getBoundingClientRect().top)).toBeGreaterThanOrEqual(await page.locator('header').evaluate(node => node.getBoundingClientRect().bottom));
});

test('navigation remains usable when the viewport changes', async ({ page }) => {
  await page.goto(entry);
  await page.getByRole('navigation').getByRole('link', { name: 'Skills' }).focus();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.getByRole('navigation')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
});

test('skip link and desktop active navigation work without obscuring headings', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(entry);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  for (const name of ['Skills', 'Projects', 'Research', 'Contact']) {
    const link = page.getByRole('navigation').getByRole('link', { name, exact: true });
    await link.click();
    await expect(link).toHaveAttribute('aria-current', 'location');
    const target = page.locator(await link.getAttribute('href'));
    expect(await target.evaluate(node => node.getBoundingClientRect().top)).toBeGreaterThanOrEqual(await page.locator('header').evaluate(node => node.getBoundingClientRect().bottom));
  }
});

test('navigation and all substantive content work with JavaScript disabled', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 844 }, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    await page.goto(new URL(entry, baseURL).href);
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.locator('.menu-toggle')).toBeHidden();
    await page.getByRole('navigation').getByRole('link', { name: 'Projects', exact: true }).click();
    expect(await page.locator('#projects .section-number').evaluate(node => node.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
    await expect(page.locator('.paper-title')).toBeVisible();
    await expect(page.locator('.iot-metrics dd').first()).toHaveText('1,000');
    await expect(page.locator('.doi-link')).toHaveAttribute('href', /doi\.org/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  } finally { await context.close(); }
});

test('reduced motion preference disables smooth scrolling and long transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(entry);
  expect(await page.locator('html').evaluate(node => getComputedStyle(node).scrollBehavior)).toBe('auto');
  const duration = await page.locator('.button').first().evaluate(node => getComputedStyle(node).transitionDuration);
  expect(duration.split(',').every(value => parseFloat(value) <= 0.001)).toBeTruthy();
});

test('resources, anchors and local links resolve without runtime errors or external assets', async ({ page, request }) => {
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', item => errors.push(item.url()));
  page.on('request', item => requests.push(item.url()));
  await page.goto(entry);
  const inspection = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
    return {
      duplicates: ids.filter((id, index) => ids.indexOf(id) !== index),
      badAnchors: [...document.querySelectorAll('a[href^="#"]')].map(node => node.hash).filter(hash => !document.getElementById(hash.slice(1))),
      emptyLinks: document.querySelectorAll('a:not([href]), a[href=""], a[href="#"]').length,
      resources: [...document.querySelectorAll('img, script[src], link[rel="stylesheet"], link[rel="icon"]')].map(node => node.src || node.href)
    };
  });
  expect(inspection.duplicates).toEqual([]);
  expect(inspection.badAnchors).toEqual([]);
  expect(inspection.emptyLinks).toBe(0);
  for (const url of inspection.resources) expect((await request.get(url)).status()).toBe(200);
  expect(requests.every(url => new URL(url).origin === new URL(page.url()).origin)).toBeTruthy();
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) {
  test(`automated WCAG A/AA accessibility scan at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(entry);
    const scan = async () => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect((await scan()).violations).toEqual([]);
    if (width < 1024) {
      await page.getByRole('button', { name: 'Menu' }).click();
      expect((await scan()).violations).toEqual([]);
    }
  });
}

test('workflow isolates validation from manual-only main deployment', async () => {
  const workflow = await readFile(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  expect(workflow).toContain('pull_request:');
  expect(workflow).toContain('push:');
  expect(workflow).toContain('workflow_dispatch:');
  expect(workflow).toContain('needs: verify');
  expect(workflow).toContain("if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main' && needs.verify.result == 'success'");
  expect(workflow).toContain('pages: write');
  expect(workflow).toContain('id-token: write');
  expect(workflow).toContain('name: github-pages');
  expect(workflow).toContain('path: site');
});
