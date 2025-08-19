import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  retries: 1,
  reporter: [['json', { outputFile: 'pw-report.json' }], ['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'ja-JP'
  },
  webServer: {
    command: 'npm run dev:js',
    port: 3001,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 12'] } },
    { name: 'tablet', use: { ...devices['iPad Pro'] } }
  ]
});