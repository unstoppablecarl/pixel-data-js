import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const setupFile = fileURLToPath(new URL('./tests/vitest-setup.ts', import.meta.url))

export default defineConfig({
  define: {
    __DEV__: true,
  },
  test: {
    // Global coverage config applies to all projects
    coverage: {
      enabled: false,
      provider: 'v8',
      reporter: ['text', 'lcovonly', 'html'],
      all: true,
      include: ['src/**/*'],
      exclude: ['tests/**/*.ts'],
    },
    // Typecheck is usually best run once across the whole workspace
    typecheck: {
      enabled: true,
      tsconfig: 'tsconfig.json',
      include: ['tests/**/*.test.ts', 'readme/**/*.ts'],
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/**/*.test.ts'],
          environment: 'jsdom',
          setupFiles: [setupFile],
          mockReset: true,
          clearMocks: true,
          restoreMocks: true,
        },
      },
      {
        test: {
          name: 'browser',
          include: ['tests-browser/**/*.test.ts'],
          browser: {
            enabled: true,
            instances: [{
              browser: 'chromium',
            }],
            provider: 'playwright',
            headless: true,
          }
        },
      },
    ],
  },
})
