import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

/**
 * Browser client for `'use client'` components (admin panel — Phase 5).
 *
 * Not used by any current code — public pages are Server Components reading via
 * ./read. createBrowserClient is a singleton internally, so calling this
 * repeatedly is safe. Uses the PUBLISHABLE key (safe in the browser, RLS-gated).
 */
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for the browser client.',
    );
  }

  return createBrowserClient<Database>(url, publishableKey);
}
