import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Server-only Supabase client for reading tournament results.
 *
 * Uses the SECRET key (RLS-bypassing), because RLS is enabled on every table
 * with NO policies yet — anon/publishable reads return nothing until the public
 * read policies land with the admin panel. This client is the single place that
 * choice lives: when confirmed-result read policies exist, swap the key here for
 * the publishable key and nothing else in the read layer changes.
 *
 * `import 'server-only'` makes the build fail loudly if this module is ever
 * pulled into a client bundle, keeping the secret key off the browser.
 *
 * No cookies: result reads are anonymous (not tied to a user session). The
 * cookie-bound client for Auth lives in ./server (admin panel, later).
 *
 * createClient here is lightweight and safe to call per request; it configures
 * a fetch, holding no user state. Do not share the returned client across
 * requests that carry user identity — these reads carry none.
 */
export function createReadClient() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Set them in .env.local for local dev (point at the local stack) and in the Vercel project settings before deploying. These are server-only — never prefix with NEXT_PUBLIC_.',
    );
  }

  return createClient<Database>(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
