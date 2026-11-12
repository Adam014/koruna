import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts so unit tests do not start the Cloudflare
// Worker runtime. Pure logic runs in Node; component tests can add jsdom later.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/rates/**/*.ts'],
      exclude: ['**/*.test.ts'],
      // Domain logic must stay fully covered; CI fails below this.
      thresholds: { 100: true },
    },
  },
})
