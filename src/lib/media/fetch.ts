import 'server-only';

import { createReadClient } from '../supabase/read';
import type { Database } from '../supabase/database.types';

export type MediaRow = Database['public']['Tables']['media_item']['Row'] & {
  media_item_player: { player_slug: string }[];
};

/**
 * IO boundary: every media row with its player links, in rotation order. The
 * table is tiny, so every page reads all of it and selects in memory.
 */
export async function fetchMediaRows(): Promise<MediaRow[]> {
  const supabase = createReadClient();
  const { data, error } = await supabase
    .from('media_item')
    .select('*, media_item_player(player_slug)')
    .order('created_at')
    .order('id');

  if (error) throw error;
  return data;
}
