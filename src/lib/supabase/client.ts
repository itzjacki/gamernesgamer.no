import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

/** Unused so far. createBrowserClient is a singleton, so repeat calls are safe. */
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_DB_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_DB_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_DB_SUPABASE_URL or NEXT_PUBLIC_DB_SUPABASE_PUBLISHABLE_KEY for the browser client.',
    );
  }

  return createBrowserClient<Database>(url, publishableKey);
}
