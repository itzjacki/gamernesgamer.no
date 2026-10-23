import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Anonymous, no-session client for public result reads. Uses the publishable
 * key: RLS shows anon only `confirmed = true` result rows, so no secret key is
 * needed. The cookie-bound admin client is in ./server.
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
