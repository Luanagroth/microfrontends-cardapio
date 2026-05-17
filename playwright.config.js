const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: [
    {
      command: 'npm run start:backend',
      port: 4000,
      timeout: 120000,
      reuseExistingServer: true
    },
    {
      command: 'npm run start:public',
      port: 4001,
      timeout: 120000,
      reuseExistingServer: true
    },
    {
      command: 'npm run start:container',
      port: 3000,
      timeout: 120000,
      reuseExistingServer: true
    },
    {
      command: 'npm run start:pedido',
      port: 3002,
      timeout: 120000,
      reuseExistingServer: true
    }
  ]
});
