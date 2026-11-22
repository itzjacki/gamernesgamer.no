import 'server-only';

import { revalidatePath } from 'next/cache';

/**
 * Marks every page stale after an admin edit to data public pages show.
 * Deliberately the whole site: an edit can touch pages through old and new
 * links (both /vs orders, every linked career), and an exact list goes wrong
 * quietly. Revalidation is lazy, so on a site this size it costs nothing.
 */
export function revalidateSite() {
  revalidatePath('/', 'layout');
}
