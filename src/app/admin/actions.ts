'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAuthClient } from '@/lib/supabase/server';

/**
 * Admin auth actions (Google-only OAuth, PKCE server-side flow).
 *
 * Google is the sole sign-in method: no passwords to handle, and every admin
 * already has a Google account. Signing in authenticates ANY Google user — the
 * invite-only allowlist (admin_user + is_admin()) is what actually grants admin
 * access, enforced in src/app/admin/layout.tsx and by RLS at the data layer.
 */

/**
 * Starts the Google OAuth flow. signInWithOAuth, called server-side, does NOT
 * redirect on its own — it returns the provider URL in data.url, which we
 * redirect to. The @supabase/ssr client writes the PKCE code-verifier cookie
 * onto the response as part of this call; the callback route then exchanges the
 * returned code for a session.
 */
export async function signIn() {
  const supabase = await createAuthClient();
  const origin = (await headers()).get('origin');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=/admin`,
    },
  });

  if (error || !data.url) {
    redirect('/admin/login?error=oauth_init');
  }

  // Must be outside the try/catch-free path above: redirect() throws by design,
  // so it is never wrapped in a conditional that would swallow it.
  redirect(data.url);
}

/**
 * Signs the current user out and returns them to the login page. Used by both
 * the dashboard and the non-admin rejection screen (so a user signed into the
 * wrong Google account can switch).
 */
export async function signOut() {
  const supabase = await createAuthClient();

  const { data } = await supabase.auth.getClaims();
  if (data) {
    await supabase.auth.signOut();
  }

  redirect('/admin/login');
}
