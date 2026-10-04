import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Server-only Supabase client for reading tournament results.
 *
 * Uses the PUBLISHABLE key and relies on RLS. Public read policies now exist:
 * structural tables (seasons, games, stages, matches, rounds, etc.) are world
 * readable, and the leaf result tables (game_result, season_result) expose only
 * `confirmed = true` rows to anon. So anonymous reads return exactly the public
 * data — no RLS-bypassing secret key needed. Unconfirmed, staged results stay
 * invisible to the public without any filtering in app code (the queries still
 * filter `confirmed = true` as defense-in-depth).
 *
 * `import 'server-only'` keeps this module out of client bundles. We still read
 * on the server (not the browser) because result reads happen in Server
 * Components; this is deliberately a no-cookie, no-session client — the
 * cookie-bound Auth client for the admin panel lives in ./server.
 *
 * createClient here is lightweight and safe to call per request; it configures
 * a fetch and holds no user state.
 */
export function createReadClient() {
  const url = process.env.NEXT_PUBLIC_DB_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_DB_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_DB_SUPABASE_URL or NEXT_PUBLIC_DB_SUPABASE_PUBLISHABLE_KEY. Set them in .env.local for local dev (point at the local stack) and in the Vercel project settings before deploying.',
    );
  }

  return createClient<Database>(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
