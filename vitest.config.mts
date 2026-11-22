import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Vitest is scoped to pure code: the results layer's derivation (derive/ +
 * view-models) and compose seam (compose.ts, which joins derived view-models
 * to the static src/data/sesong content), plus the YouTube link parser
 * (src/lib/media/youtube.ts). It never touches an IO layer (fetch.ts /
 * queries.ts) or any Supabase client — those stay covered by `next build`.
 * The include glob keeps the run from needing a DB or a browser environment.
 * The `@` alias is resolved so compose's `@/data/sesong` import works.
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
