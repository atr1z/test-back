import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Only include source test files, not compiled ones
    include: ['src/**/*.test.ts'],
    // Exclude E2E tests from unit test runs
    exclude: ['**/*.e2e.test.ts', '**/setup.e2e.ts', '**/helpers.e2e.ts', 'dist/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['dist', 'node_modules', '**/*.test.ts', '**/*.spec.ts', '**/*.e2e.test.ts'],
    },
  },
});

