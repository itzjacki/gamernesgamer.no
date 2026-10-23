import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './database.types';

/**
 * Refreshes the Supabase session cookie and redirects signed-out visitors away
 * from /admin. The client is per-request, never module-scoped: Vercel can reuse
 * warm instances across requests. getClaims(), not getSession(), because it
 * verifies the JWT signature; cookie data alone can be spoofed.
 *
 * This only checks that someone is signed in. The admin allowlist is enforced
 * server-side in the admin layout and by RLS.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_DB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_DB_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          if (headers) {
            Object.entries(headers).forEach(([key, value]) =>
              supabaseResponse.headers.set(key, value),
            );
          }
        },
      },
    },
  );

  // No code between createServerClient and getClaims(), or session refresh
  // becomes unreliable (@supabase/ssr guidance).
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginRoute = pathname === '/admin/login';

  if (isAdminRoute && !isLoginRoute && !claims) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
