'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAuthClient } from '@/lib/supabase/server';

/*
 * Signing in authenticates ANY Google user. Admin access comes from the
 * allowlist (admin_user + is_admin()), enforced in the (protected) layout and
 * by RLS.
 */

/**
 * Server-side signInWithOAuth doesn't redirect: it returns data.url. It also
 * writes the PKCE code-verifier cookie that /auth/callback needs.
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

  redirect(data.url);
}

/** Also used on the non-admin screen, to switch Google account. */
export async function signOut() {
  const supabase = await createAuthClient();

  const { data } = await supabase.auth.getClaims();
  if (data) {
    await supabase.auth.signOut();
  }

  redirect('/admin/login');
}
