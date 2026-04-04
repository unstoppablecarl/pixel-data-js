import { fileURLToPath } from 'node:url'
import tsconfigPaths from 'vite-tsconfig-paths'
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
      exclude: [
        'tests/**/*.ts',
        'src/Canvas/canvas-blend-modes.ts'
      ],
    },
    // Typecheck is usually best run once across the whole workspace
    typecheck: {
      enabled: true,
      tsconfig: 'tsconfig.json',
      include: ['tests/**/*.test.ts', 'readme/**/*.ts'],
    },
    projects: [
      {
        plugins: [tsconfigPaths()],
        test: {
          name: 'unit',
          include: ['tests/**/*.test.ts'],
          environment: 'jsdom',
          setupFiles: [setupFile],
        },
      },
      {
        resolve: {
          alias: {
            // Map the specific entry point for tests
            '@/index': fileURLToPath(new URL('./dist/index.prod.js', import.meta.url)),

            // 2. Map the root alias
            '@/': fileURLToPath(new URL('./dist/', import.meta.url)),
          },
        },
        test: {
          name: 'dist',
          include: ['tests/**/*.test.ts'],
          exclude: [
            'tests/Clipboard/*',
            'tests/**/NonBuild/*.test.ts',
            'tests/Input/*',
          ],
          environment: 'jsdom',
          setupFiles: [setupFile],
        },
      },
    ],
  },
})
