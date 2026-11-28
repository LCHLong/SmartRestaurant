const path = require('path');
const { defineConfig } = require('@playwright/test');

const ROOT_DIR = path.resolve(__dirname, '../..');
const TMP_OUTPUT_DIR = path.resolve(__dirname, '.tmp-test-results');

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: /.*\.spec\.js$/,
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: TMP_OUTPUT_DIR,

  globalSetup: path.resolve(__dirname, 'global-setup.js'),
  globalTeardown: path.resolve(__dirname, 'global-teardown.js'),

  reporter: [
    ['list'],
    [
      path.resolve(__dirname, 'reporters/audit-json-reporter.js'),
      {
        outputFile: path.resolve(__dirname, 'results.json'),
      },
    ],
  ],

  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'off',
    actionTimeout: 10_000,
  },

  webServer: [
    {
      command: 'PIPECAT_SERVICE_URL=http://localhost:8000 NODE_ENV=test npm start',
      cwd: path.resolve(ROOT_DIR, 'backend'),
      url: 'http://localhost:5001/api/categories',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'npm run dev -- --port 5173',
      cwd: path.resolve(ROOT_DIR, 'frontend'),
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
