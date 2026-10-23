'use server';

import { revalidatePath } from 'next/cache';
import { createAuthClient } from '@/lib/supabase/server';

/*
 * Authorization and the last-admin guard live in the SECURITY DEFINER RPCs
 * (admin_add / admin_remove); these actions only translate the outcome.
 * They return errors rather than throw, so a blocked remove renders inline
 * instead of hitting an error boundary.
 */

export interface AdminActionResult {
  error: string | null;
}

export async function addAdmin(userId: string): Promise<AdminActionResult> {
  if (!userId) {
    return { error: 'Ingen bruker valgt.' };
  }

  const supabase = await createAuthClient();
  const { error } = await supabase.rpc('admin_add', {
    target_user_id: userId,
  });

  if (error) {
    // Unexpected from the UI (it only offers existing non-admins): keep generic.
    return { error: 'Kunne ikke legge til administratoren. Prøv igjen.' };
  }

  revalidatePath('/admin');
  return { error: null };
}

export async function removeAdmin(userId: string): Promise<AdminActionResult> {
  if (!userId) {
    return { error: 'Ingen bruker valgt.' };
  }

  const supabase = await createAuthClient();
  const { error } = await supabase.rpc('admin_remove', {
    target_user_id: userId,
  });

  if (error) {
    // The last-admin guard raises P0001. Match the code, not the message.
    if (error.code === 'P0001') {
      return { error: 'Siste administrator kan ikke fjernes.' };
    }
    return { error: 'Kunne ikke fjerne administratoren. Prøv igjen.' };
  }

  revalidatePath('/admin');
  return { error: null };
}
