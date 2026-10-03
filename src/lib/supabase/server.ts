import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

/**
 * Cookie-bound server client for Supabase Auth (admin panel — Phase 5).
 *
 * NOT used by the public result-read layer (that is ./read, which is anonymous
 * and uses the secret key). This client carries the admin's session via cookies
 * and is created per request — never module-scoped — because it closes over the
 * current request's cookie store.
 *
 * Pattern follows current @supabase/ssr: async factory, cookies() awaited,
 * getAll/setAll. setAll is wrapped in try/catch because Server Components cannot
 * write cookies; a proxy/middleware refreshes the session there instead.
 *
 * Uses the PUBLISHABLE key (RLS-enforced) — admin privileges come from the
 * authenticated session + RLS policies, not from a privileged key.
 */
export async function createAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for the Auth client.',
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
          // Called from a Server Component — ignore; middleware refreshes the session.
        }
      },
    },
  });
}
