import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Vitest is scoped to the PURE derivation layer only (src/lib/results/derive +
 * its view-models). It never touches the IO layer (fetch.ts/queries.ts) or any
 * Supabase client — those stay covered by `next build`. The include glob is
 * deliberately narrow so the test run can't drift into needing a DB or a
 * browser environment.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/lib/**/__tests__/**/*.test.ts'],
    environment: 'node',
  },
});
