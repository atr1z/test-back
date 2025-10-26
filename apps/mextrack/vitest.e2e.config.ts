import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'mextrack-e2e',
    include: ['src/**/*.e2e.test.ts'],
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.e2e.ts'],
    testTimeout: 30000, // E2E tests may take longer
    hookTimeout: 30000,
    // Run E2E tests sequentially to avoid database conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
