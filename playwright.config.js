import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:13000', browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL || undefined, headless: true },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 13000 --strictPort',
    url: 'http://127.0.0.1:13000',
    reuseExistingServer: false,
    env: { API_PROXY_TARGET: process.env.TEST_API_TARGET || 'http://localhost:8080' },
  },
});
