import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: process.env.PLAYWRIGHT_PORT ? `npm run dev -- -p ${process.env.PLAYWRIGHT_PORT}` : 'npm run dev',
    url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /f3-visual\.spec\.ts/,
    },
    {
      name: 'f3-light-desktop',
      testMatch: /f3-visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], colorScheme: 'light' },
    },
    {
      name: 'f3-dark-desktop',
      testMatch: /f3-visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], colorScheme: 'dark' },
    },
    {
      name: 'f3-light-mobile',
      testMatch: /f3-visual\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'light',
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
