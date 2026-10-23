import { NextResponse, type NextRequest } from 'next/server';
import { createAuthClient } from '@/lib/supabase/server';

/**
 * OAuth PKCE callback. Deliberately not under /admin, so the proxy's gate lets
 * a not-yet-signed-in visitor through.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // Internal paths only (no open redirect).
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

  return NextResponse.redirect(`${origin}/admin/login?error=auth_callback`);
}
