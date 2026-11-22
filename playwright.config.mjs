import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.SITE_URL || 'http://127.0.0.1:4273/personal-portfolio-v2-guided/',
    browserName: 'chromium',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: process.env.SITE_URL ? undefined : {
    command: 'node scripts/serve.mjs',
    url: 'http://127.0.0.1:4273/personal-portfolio-v2-guided/me-designed-page.html',
    reuseExistingServer: !process.env.CI,
    timeout: 20000
  }
});
