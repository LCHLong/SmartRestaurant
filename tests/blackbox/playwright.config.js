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
    ['html', { outputFolder: path.resolve(process.cwd(), 'test-results/html-report'), open: 'never' }],
    [require.resolve('./status-reporter.js')]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    // Chỉ lưu video, ảnh và trace khi test case thất bại
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
