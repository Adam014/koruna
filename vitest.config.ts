import { cloudflareTest } from '@cloudflare/vitest-plugin'
import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts so unit tests do not start the Cloudflare
// Worker runtime for the app. Two projects:
// - app: pure logic runs in Node; component tests opt into jsdom with a
//   `@vitest-environment jsdom` comment.
// - worker: the Worker runs in workerd, the runtime it has in production.
//   https://developers.cloudflare.com/workers/testing/vitest-integration/
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'app',
          include: ['src/**/*.test.{ts,tsx}'],
          environment: 'node',
          setupFiles: ['src/test/setup.ts'],
          // West of UTC, so a date shifted by the local time zone shows up as
          // the previous day. CI runs in UTC and developers often east of
          // it, where such a bug would never fail a test.
          env: { TZ: 'America/New_York' },
        },
      },
      {
        plugins: [
          cloudflareTest({ wrangler: { configPath: './wrangler.jsonc' } }),
        ],
        test: {
          name: 'worker',
          include: ['worker/**/*.test.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/rates/**/*.ts'],
      exclude: ['**/*.test.ts'],
      // Domain logic must stay fully covered; CI fails below this.
      thresholds: { 100: true },
    },
  },
})
