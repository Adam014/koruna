import { defineConfig, devices } from '@playwright/test'

// End-to-end test of the main flow against the production build.
// https://playwright.dev/docs/test-configuration
// https://playwright.dev/docs/ci-intro
const PORT = 4173

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  // All three engines and two phones: the currency select takes a different
  // path where the customizable select is missing (Firefox, Safari), and the
  // layout changes at phone width.
  // https://playwright.dev/docs/test-projects
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 15'] } },
  ],
  webServer: {
    command: `bunx vite build && bunx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
})
