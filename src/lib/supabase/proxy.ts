import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './database.types';

/**
 * Refreshes the Supabase Auth session cookie and gates /admin routes.
 *
 * Called from the root `src/proxy.ts` (Next.js 16's Proxy convention, formerly
 * "middleware"). Follows the current @supabase/ssr pattern: create a per-request
 * server client (never module-scoped — Vercel Fluid compute can reuse warm
 * instances across requests), call getClaims() to validate + refresh the JWT,
 * and return a response that carries any refreshed cookies.
 *
 * getClaims() is used (not getUser/getSession) because it validates the JWT
 * signature locally against the project's asymmetric signing keys — the current
 * recommended way to protect pages. Session data from cookies alone can be
 * spoofed; getClaims verifies it.
 *
 * Gating: only /admin/* is protected. /admin/login is always reachable so an
 * unauthenticated admin can sign in. Everything else (the public site) passes
 * through — the session is still refreshed so a signed-in admin stays signed in
 * as they browse. Being in the allowlist (is_admin) is enforced by RLS at the
 * data layer; this proxy only checks that *someone* is signed in.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

  // Do not run code between createServerClient and getClaims() — it keeps the
  // session refresh reliable (per @supabase/ssr guidance).
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
