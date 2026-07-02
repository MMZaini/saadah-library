import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(process.cwd()),
      // The `server-only` marker package refuses to load outside a React Server
      // context; stub it so server modules can be unit-tested in Node.
      'server-only': path.resolve(process.cwd(), 'tests/helpers/server-only-stub.mjs'),
    },
  },
  test: {
    environment: 'node',
    // Several suites read the real versioned dataset off disk; a cold
    // filesystem cache (fresh CI runners) can push them past the 5s default.
    testTimeout: 30_000,
    include: [
      'tests/**/*.test.mjs',
      'tests/**/*.test.ts',
      'tools/**/*.test.mjs',
      'tools/**/*.test.ts',
    ],
  },
})
