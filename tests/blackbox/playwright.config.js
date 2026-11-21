// tests/blackbox/playwright.config.js
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './',
  outputDir: path.resolve(process.cwd(), 'test-results/artifacts'),
  timeout: 90000,
  expect: {
    timeout: 10000,
  },
  workers: 2,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
    [require.resolve('./status-reporter.js')]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    // CƯỠNG CHẾ 100% QUAY VIDEO VÀ CHỤP ẢNH
    video: 'on',
    screenshot: 'on',
    trace: 'on',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
