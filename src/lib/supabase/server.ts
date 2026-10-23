import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

/**
 * Cookie-bound client for the admin session. Per request, never module-scoped:
 * it closes over the request's cookie store. Admin rights come from the
 * session + RLS, not a privileged key. Public reads use ./read.
 */
export async function createAuthClient() {
  const url = process.env.NEXT_PUBLIC_DB_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_DB_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_DB_SUPABASE_URL or NEXT_PUBLIC_DB_SUPABASE_PUBLISHABLE_KEY for the Auth client.',
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components can't write cookies; src/proxy.ts refreshes the session.
        }
      },
    },
  });
}
