export interface PowerUp {
  /** Join key to the DB `power_up.slug`; unique within a season only. */
  slug: string;
  name: string;
  description: string;
  imagePath: string;
  isCurse?: boolean;
}
