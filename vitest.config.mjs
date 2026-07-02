import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(process.cwd()),
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
