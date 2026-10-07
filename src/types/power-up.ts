export interface PowerUp {
  /**
   * Kebab-case identifier matching the DB `power_up.slug` for this season.
   * Unique within a season (DB enforces `UNIQUE (season_id, slug)`); the same
   * slug may recur across seasons. This is the join key between the static
   * content here and the seeded results — mirrors `Game.slug`.
   */
  slug: string;
  name: string;
  description: string;
  imagePath: string;
  isCurse?: boolean;
}
