import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Vitest is scoped to the pure results layer: the derivation (derive/ +
 * view-models) and the compose seam (compose.ts, which joins derived
 * view-models to the static src/data/sesong content). It never touches the IO
 * layer (fetch.ts/queries.ts) or any Supabase client — those stay covered by
 * `next build`. The include glob is deliberately narrow so the test run can't
 * drift into needing a DB or a browser environment. The `@` alias is resolved
 * so compose's `@/data/sesong` import works.
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
