import { NextResponse, type NextRequest } from 'next/server';
import { createAuthClient } from '@/lib/supabase/server';

/**
 * OAuth code-exchange callback (PKCE flow).
 *
 * Google redirects here with a `?code` after the user consents.
 * exchangeCodeForSession swaps that code (plus the PKCE verifier cookie set
 * during sign-in) for a session, writing the session cookies through the
 * cookie-bound client. The redirect response then carries those Set-Cookie
 * headers back to the browser.
 *
 * This route is deliberately NOT under /admin, so the proxy's admin gate lets
 * it through for an as-yet-unauthenticated visitor completing sign-in.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // Only ever an internal path; defaults to the dashboard.
  let next = searchParams.get('next') ?? '/admin';
  if (!next.startsWith('/')) {
    next = '/admin';
  }

  if (code) {
    const supabase = await createAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        // No load balancer locally — the request origin is trustworthy.
        return NextResponse.redirect(`${origin}${next}`);
      }
      if (forwardedHost) {
        // Behind Vercel's proxy, origin is the internal host; use the
        // forwarded host so the browser lands on the public domain.
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code, or the exchange failed — send back to login with a flag.
  return NextResponse.redirect(`${origin}/admin/login?error=auth_callback`);
}
