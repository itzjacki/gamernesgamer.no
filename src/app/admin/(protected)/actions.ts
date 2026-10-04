'use server';

import { revalidatePath } from 'next/cache';
import { createAuthClient } from '@/lib/supabase/server';

/**
 * Admin membership mutations. These call the SECURITY DEFINER RPCs
 * (admin_add / admin_remove), which re-check is_admin() server-side and enforce
 * the last-admin guard atomically — the app never holds a privileged key, and
 * never trusts the client for authorization. The actions only translate the
 * outcome into Norwegian for the UI.
 *
 * Both return a { error: string | null } result the client renders inline,
 * rather than throwing, so a blocked remove (last admin) reads as a normal
 * message instead of an error boundary.
 */

export interface AdminActionResult {
  error: string | null;
}

/** Promote an existing signed-in user to admin. */
export async function addAdmin(userId: string): Promise<AdminActionResult> {
  if (!userId) {
    return { error: 'Ingen bruker valgt.' };
  }

  const supabase = await createAuthClient();
  const { error } = await supabase.rpc('admin_add', {
    target_user_id: userId,
  });

  if (error) {
    // not authorized / user does not exist — both are unexpected from the UI
    // (the dropdown only offers valid, existing non-admins), so keep it generic.
    return { error: 'Kunne ikke legge til administratoren. Prøv igjen.' };
  }

  revalidatePath('/admin');
  return { error: null };
}

/** Remove an admin. The DB blocks removing the last remaining admin. */
export async function removeAdmin(userId: string): Promise<AdminActionResult> {
  if (!userId) {
    return { error: 'Ingen bruker valgt.' };
  }

  const supabase = await createAuthClient();
  const { error } = await supabase.rpc('admin_remove', {
    target_user_id: userId,
  });

  if (error) {
    // The one expected, user-facing failure is the last-admin guard, which the
    // RPC raises with SQLSTATE P0001. Match on the code (supabase-js surfaces
    // the Postgres errcode as error.code) rather than the message text, so the
    // check doesn't break if the wording ever changes.
    if (error.code === 'P0001') {
      return { error: 'Siste administrator kan ikke fjernes.' };
    }
    return { error: 'Kunne ikke fjerne administratoren. Prøv igjen.' };
  }

  revalidatePath('/admin');
  return { error: null };
}
